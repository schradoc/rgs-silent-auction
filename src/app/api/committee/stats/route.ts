import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function verifyCommitteeSession(request: NextRequest): boolean {
  const session = request.cookies.get('committee_session')
  return session?.value === 'authenticated'
}

export async function GET(request: NextRequest) {
  if (!verifyCommitteeSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')

    const [
      totalBids,
      activeBiddersCount,
      prizes,
      recentBids,
      settings,
    ] = await Promise.all([
      prisma.bid.count(),
      prisma.bidder.count({
        where: {
          bids: { some: {} },
        },
      }),
      prisma.prize.findMany({
        where: { isActive: true, parentPrizeId: null },
        select: {
          id: true,
          title: true,
          category: true,
          currentHighestBid: true,
          minimumBid: true,
          _count: { select: { bids: true } },
        },
      }),
      prisma.bid.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          bidder: { select: { name: true, tableNumber: true } },
          prize: { select: { title: true } },
        },
      }),
      prisma.auctionSettings.findUnique({ where: { id: 'settings' } }),
    ])

    // Total raised
    const totalRaised = prizes.reduce((sum, p) => sum + p.currentHighestBid, 0)

    // Prizes with bids
    const prizesWithBids = prizes.filter(p => p._count.bids > 0).length

    // Prize leaderboard — top 10 by current bid
    const prizeLeaderboard = [...prizes]
      .filter(p => p.currentHighestBid > 0)
      .sort((a, b) => b.currentHighestBid - a.currentHighestBid)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        title: p.title,
        currentBid: p.currentHighestBid,
        bidCount: p._count.bids,
      }))

    // Cold prizes — 0 or fewest bids
    const coldPrizes = [...prizes]
      .sort((a, b) => a._count.bids - b._count.bids)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        title: p.title,
        currentBid: p.currentHighestBid,
        minimumBid: p.minimumBid,
        bidCount: p._count.bids,
      }))

    // Table leaderboard
    const winningBids = await prisma.bid.findMany({
      where: { status: { in: ['WINNING', 'WON'] } },
      select: {
        amount: true,
        bidder: { select: { tableNumber: true } },
      },
    })

    const tableMap = new Map<string, number>()
    for (const bid of winningBids) {
      const table = bid.bidder.tableNumber
      if (table) {
        tableMap.set(table, (tableMap.get(table) || 0) + bid.amount)
      }
    }
    const tableLeaderboard = [...tableMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tableNumber, totalValue]) => ({ tableNumber, totalValue }))

    // Category breakdown
    const categoryMap = new Map<string, { value: number; count: number }>()
    for (const prize of prizes) {
      const cat = prize.category
      const existing = categoryMap.get(cat) || { value: 0, count: 0 }
      existing.value += prize.currentHighestBid
      existing.count += 1
      categoryMap.set(cat, existing)
    }
    const categoryBreakdown = [...categoryMap.entries()]
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value)

    // Bid timeline — last 4 hours, hourly buckets
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
    const timelineBids = await prisma.bid.findMany({
      where: { createdAt: { gte: fourHoursAgo } },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    })

    const now = new Date()
    const timeline: Array<{ hour: string; bids: number; value: number }> = []
    for (let i = 3; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000)
      const hourEnd = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourBids = timelineBids.filter(
        b => new Date(b.createdAt) >= hourStart && new Date(b.createdAt) < hourEnd
      )
      timeline.push({
        hour: hourStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        bids: hourBids.length,
        value: hourBids.reduce((sum, b) => sum + b.amount, 0),
      })
    }

    return NextResponse.json({
      stats: {
        totalRaised,
        activeBidders: activeBiddersCount,
        totalBids,
        totalPrizes: prizes.length,
        prizesWithBids,
      },
      recentBids: recentBids.map(b => ({
        id: b.id,
        amount: b.amount,
        createdAt: b.createdAt,
        bidderName: b.bidder.name,
        tableNumber: b.bidder.tableNumber,
        prizeTitle: b.prize.title,
      })),
      prizeLeaderboard,
      coldPrizes,
      tableLeaderboard,
      categoryBreakdown,
      timeline,
      auctionState: settings?.auctionState || 'DRAFT',
      auctionEndTime: settings?.auctionEndTime,
    })
  } catch (error) {
    console.error('Committee stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
