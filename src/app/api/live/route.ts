import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')

    // Get auction settings
    const settings = await prisma.auctionSettings.findUnique({
      where: { id: 'settings' },
    })

    // Get total stats
    const [prizesCount, biddersCount, bidsCount, prizes] = await Promise.all([
      prisma.prize.count({ where: { isActive: true, parentPrizeId: null } }),
      prisma.bidder.count(),
      prisma.bid.count(),
      prisma.prize.findMany({
        where: { isActive: true, parentPrizeId: null },
        select: {
          id: true,
          currentHighestBid: true,
        },
      }),
    ])

    const totalRaised = prizes.reduce((sum, p) => sum + p.currentHighestBid, 0)

    // Get recent bids (last 10)
    const recentBids = await prisma.bid.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        bidder: { select: { name: true, tableNumber: true } },
        prize: { select: { title: true, slug: true, imageUrl: true } },
      },
    })

    // Get hot items (most bids in last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const recentBidCounts = await prisma.bid.groupBy({
      by: ['prizeId'],
      where: { createdAt: { gte: thirtyMinutesAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const hotItemIds = recentBidCounts.map((r) => r.prizeId)
    const hotItems = await prisma.prize.findMany({
      where: { id: { in: hotItemIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        currentHighestBid: true,
        _count: { select: { bids: true } },
      },
    })

    // Sort by recent activity
    const sortedHotItems = hotItems.sort((a, b) => {
      const aIndex = hotItemIds.indexOf(a.id)
      const bIndex = hotItemIds.indexOf(b.id)
      return aIndex - bIndex
    })

    // Get top tables by total bid value
    const tableStats = await prisma.bid.groupBy({
      by: ['bidderId'],
      where: { status: { in: ['WINNING', 'WON'] } },
      _sum: { amount: true },
    })

    const bidderIds = tableStats.map((t) => t.bidderId)
    const bidders = await prisma.bidder.findMany({
      where: { id: { in: bidderIds } },
      select: { id: true, tableNumber: true },
    })

    // Group by table
    const tableMap = new Map<string, number>()
    for (const stat of tableStats) {
      const bidder = bidders.find((b) => b.id === stat.bidderId)
      if (bidder) {
        const current = tableMap.get(bidder.tableNumber) || 0
        tableMap.set(bidder.tableNumber, current + (stat._sum.amount || 0))
      }
    }

    const topTables = [...tableMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tableNumber, totalValue]) => ({ tableNumber, totalValue }))

    // Get helper leaderboard
    const helpers = await prisma.helper.findMany({
      where: { isActive: true },
      include: {
        bidsPrompted: { select: { amount: true } },
      },
    })

    const helperLeaderboard = helpers
      .map((h) => ({
        id: h.id,
        name: h.name,
        avatarColor: h.avatarColor,
        totalBids: h.bidsPrompted.length,
        totalValue: h.bidsPrompted.reduce((sum, b) => sum + b.amount, 0),
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)

    // Get featured prize (highest value currently)
    const featuredPrize = await prisma.prize.findFirst({
      where: { isActive: true, parentPrizeId: null, currentHighestBid: { gt: 0 } },
      orderBy: { currentHighestBid: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        shortDescription: true,
        currentHighestBid: true,
        minimumBid: true,
        _count: { select: { bids: true } },
      },
    })

    return NextResponse.json({
      stats: {
        totalRaised,
        activeBidders: biddersCount,
        totalBids: bidsCount,
        totalPrizes: prizesCount,
      },
      settings: {
        isAuctionOpen: settings?.isAuctionOpen ?? true,
        auctionEndTime: settings?.auctionEndTime,
      },
      recentBids,
      hotItems: sortedHotItems,
      topTables,
      helperLeaderboard,
      featuredPrize,
    })
  } catch (error) {
    console.error('Live data error:', error)
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 })
  }
}
