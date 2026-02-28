import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await verifyAdminSession()
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')

    const now = new Date()
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000)
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

    // DB latency check
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatencyMs = Date.now() - dbStart

    // Parallel queries for all monitor data
    const [
      settings,
      totalBidders,
      activeBiddersLast15m,
      biddersWhoBid,
      totalBids,
      bidsLast15m,
      prizes,
      recentBids,
      notifications,
      helpers,
      winners,
      timelineBids,
    ] = await Promise.all([
      prisma.auctionSettings.findUnique({ where: { id: 'settings' } }),
      prisma.bidder.count(),
      prisma.bidder.count({
        where: {
          bids: { some: { createdAt: { gte: fifteenMinAgo } } },
        },
      }),
      prisma.bidder.count({
        where: { bids: { some: {} } },
      }),
      prisma.bid.count(),
      prisma.bid.count({
        where: { createdAt: { gte: fifteenMinAgo } },
      }),
      prisma.prize.findMany({
        where: { isActive: true, parentPrizeId: null },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          currentHighestBid: true,
          minimumBid: true,
          _count: { select: { bids: true } },
        },
      }),
      prisma.bid.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          bidder: { select: { name: true, tableNumber: true } },
          prize: { select: { title: true, slug: true } },
        },
      }),
      prisma.notification.findMany({
        orderBy: { sentAt: 'desc' },
        take: 50,
        select: {
          id: true,
          type: true,
          channel: true,
          sentAt: true,
        },
      }),
      prisma.helper.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          assignedTables: true,
          _count: { select: { bidsPrompted: true } },
        },
      }),
      prisma.winner.count(),
      prisma.bid.findMany({
        where: { createdAt: { gte: fourHoursAgo } },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Revenue metrics
    const totalRaised = prizes.reduce((sum, p) => sum + p.currentHighestBid, 0)
    const bidAmounts = recentBids.map(b => b.amount)
    const avgBidAmount = bidAmounts.length > 0
      ? Math.round(bidAmounts.reduce((a, b) => a + b, 0) / bidAmounts.length)
      : 0

    // Cold prizes (0-1 bids)
    const coldPrizes = prizes
      .filter(p => p._count.bids <= 1)
      .sort((a, b) => a._count.bids - b._count.bids)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        minimumBid: p.minimumBid,
        currentBid: p.currentHighestBid,
        bidCount: p._count.bids,
      }))

    // Top 5 most-bid-on prizes
    const topPrizes = [...prizes]
      .sort((a, b) => b._count.bids - a._count.bids)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        currentBid: p.currentHighestBid,
        bidCount: p._count.bids,
      }))

    // Notification breakdown
    const notifByType: Record<string, number> = {}
    const notifByChannel: Record<string, number> = {}
    for (const n of notifications) {
      notifByType[n.type] = (notifByType[n.type] || 0) + 1
      if (n.channel) {
        notifByChannel[n.channel] = (notifByChannel[n.channel] || 0) + 1
      }
    }

    // Helper activity
    const helperActivity = helpers.map(h => ({
      id: h.id,
      name: h.name,
      assignedTables: h.assignedTables,
      bidsSubmitted: h._count.bidsPrompted,
    }))

    // Hourly timeline (last 4 hours)
    const timeline: Array<{ hour: string; bids: number; value: number }> = []
    for (let i = 3; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - (i + 1) * 60 * 60 * 1000)
      const hourEnd = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourBids = timelineBids.filter(
        b => new Date(b.createdAt) >= hourStart && new Date(b.createdAt) < hourEnd
      )
      timeline.push({
        hour: hourStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        bids: hourBids.length,
        value: hourBids.reduce((sum, b) => sum + b.amount, 0),
      })
    }

    // Funnel
    const verifiedBidders = await prisma.bidder.count({
      where: { phoneVerified: true },
    })

    const funnel = {
      registered: totalBidders,
      verified: verifiedBidders,
      bid: biddersWhoBid,
      won: winners,
    }

    // Engagement rate
    const engagementRate = totalBidders > 0
      ? Math.round((biddersWhoBid / totalBidders) * 100)
      : 0

    return NextResponse.json({
      health: {
        auctionState: settings?.auctionState || 'DRAFT',
        endTime: settings?.auctionEndTime,
        dbLatencyMs,
      },
      activity: {
        totalBidders,
        activeBiddersLast15m,
        totalBids,
        bidsLast15m,
        totalRaised,
        avgBidAmount,
        engagementRate,
      },
      recentBids: recentBids.map(b => ({
        id: b.id,
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt,
        bidderName: b.bidder.name,
        tableNumber: b.bidder.tableNumber,
        prizeTitle: b.prize.title,
        prizeSlug: b.prize.slug,
      })),
      topPrizes,
      coldPrizes,
      timeline,
      notifications: {
        total: notifications.length,
        byType: notifByType,
        byChannel: notifByChannel,
        recent: notifications.slice(0, 10).map(n => ({
          id: n.id,
          type: n.type,
          channel: n.channel,
          sentAt: n.sentAt,
        })),
      },
      helperActivity,
      funnel,
    })
  } catch (error) {
    console.error('Monitor API error:', error)
    return NextResponse.json({ error: 'Failed to fetch monitor data' }, { status: 500 })
  }
}
