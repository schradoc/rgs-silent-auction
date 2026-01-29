import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get(COOKIE_NAMES.adminSession)?.value === 'true'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Get bidding activity by hour (last 24 hours)
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const recentBids = await prisma.bid.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group bids by hour
    const hourlyData: { hour: string; bids: number; value: number }[] = []
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
      hourStart.setMinutes(0, 0, 0)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)

      const bidsInHour = recentBids.filter(
        (bid) => bid.createdAt >= hourStart && bid.createdAt < hourEnd
      )

      hourlyData.push({
        hour: hourStart.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true }),
        bids: bidsInHour.length,
        value: bidsInHour.reduce((sum, bid) => sum + bid.amount, 0),
      })
    }

    // Top prizes by bid count
    const topPrizes = await prisma.prize.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        currentHighestBid: true,
        minimumBid: true,
        _count: { select: { bids: true } },
      },
      orderBy: { bids: { _count: 'desc' } },
      take: 5,
    })

    // Category breakdown
    const categoryStats = await prisma.prize.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true },
      _sum: { currentHighestBid: true },
    })

    // Total bids by category - need a separate query
    const prizesByCategory = await prisma.prize.findMany({
      where: { isActive: true },
      select: {
        category: true,
        _count: { select: { bids: true } },
      },
    })

    const categoryBidCounts: Record<string, number> = {}
    prizesByCategory.forEach((prize) => {
      categoryBidCounts[prize.category] = (categoryBidCounts[prize.category] || 0) + prize._count.bids
    })

    const categoryData = categoryStats.map((cat) => ({
      category: cat.category,
      prizes: cat._count.id,
      totalValue: cat._sum.currentHighestBid || 0,
      bids: categoryBidCounts[cat.category] || 0,
    }))

    // Bidder activity (verified vs unverified, bid counts)
    const bidderStats = await prisma.bidder.aggregate({
      _count: { id: true },
    })

    const verifiedBidders = await prisma.bidder.count({
      where: { emailVerified: true },
    })

    const biddersWithBids = await prisma.bidder.count({
      where: { bids: { some: {} } },
    })

    // Recent activity highlights
    const lastHourBids = recentBids.filter(
      (bid) => bid.createdAt >= new Date(now.getTime() - 60 * 60 * 1000)
    ).length

    const lastHourValue = recentBids
      .filter((bid) => bid.createdAt >= new Date(now.getTime() - 60 * 60 * 1000))
      .reduce((sum, bid) => sum + bid.amount, 0)

    return NextResponse.json({
      hourlyActivity: hourlyData,
      topPrizes: topPrizes.map((p) => ({
        id: p.id,
        title: p.title,
        currentBid: p.currentHighestBid || p.minimumBid,
        bidCount: p._count.bids,
      })),
      categoryBreakdown: categoryData,
      bidderStats: {
        total: bidderStats._count.id,
        verified: verifiedBidders,
        active: biddersWithBids,
      },
      recentActivity: {
        bidsLastHour: lastHourBids,
        valueLastHour: lastHourValue,
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
