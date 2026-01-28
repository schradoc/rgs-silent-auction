import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const HELPER_COOKIE = 'helper_id'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const helperId = cookieStore.get(HELPER_COOKIE)?.value

    if (!helperId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Verify helper exists
    const helper = await prisma.helper.findUnique({
      where: { id: helperId, isActive: true },
      include: {
        bidsPrompted: {
          select: { bidderId: true },
        },
      },
    })

    if (!helper) {
      return NextResponse.json({ error: 'Helper not found' }, { status: 404 })
    }

    // Get all helpers with their stats for leaderboard
    const helpers = await prisma.helper.findMany({
      where: { isActive: true },
      include: {
        bidsPrompted: {
          select: {
            id: true,
            amount: true,
            bidderId: true,
            status: true,
            createdAt: true,
          },
        },
        paperBids: {
          select: { id: true },
        },
      },
    })

    // Calculate stats for each helper
    const leaderboard = helpers.map((h) => {
      const totalBids = h.bidsPrompted.length
      const totalValue = h.bidsPrompted.reduce((sum, b) => sum + b.amount, 0)
      const uniqueBidders = new Set(h.bidsPrompted.map((b) => b.bidderId)).size
      const paperBidsCount = h.paperBids.length

      // Calculate streak (consecutive winning bids)
      const sortedBids = [...h.bidsPrompted].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      let streak = 0
      for (const bid of sortedBids) {
        if (bid.status === 'WINNING' || bid.status === 'WON') {
          streak++
        } else {
          break
        }
      }

      return {
        id: h.id,
        name: h.name,
        avatarColor: h.avatarColor,
        totalBids,
        totalValue,
        uniqueBidders,
        paperBidsCount,
        streak,
        isCurrentHelper: h.id === helperId,
      }
    })

    // Sort by total value (primary), then by total bids (secondary)
    leaderboard.sort((a, b) => {
      if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue
      return b.totalBids - a.totalBids
    })

    // Add rank
    const rankedLeaderboard = leaderboard.map((h, index) => ({
      ...h,
      rank: index + 1,
    }))

    // Get current helper's stats
    const currentHelperStats = rankedLeaderboard.find((h) => h.isCurrentHelper)

    // Get recent bids by this helper
    const recentBids = await prisma.bid.findMany({
      where: { helperId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        bidder: { select: { name: true, tableNumber: true } },
        prize: { select: { title: true, slug: true } },
      },
    })

    // Get outbid notifications for bidders this helper assisted
    const helperBidderIds = [...new Set(helper.bidsPrompted.map((b) => b.bidderId))]
    const outbidBids = await prisma.bid.findMany({
      where: {
        bidderId: { in: helperBidderIds as string[] },
        status: 'OUTBID',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        bidder: { select: { name: true, tableNumber: true } },
        prize: { select: { title: true, slug: true, currentHighestBid: true } },
      },
    })

    return NextResponse.json({
      helper: {
        id: helper.id,
        name: helper.name,
        avatarColor: helper.avatarColor,
      },
      stats: currentHelperStats,
      leaderboard: rankedLeaderboard,
      recentBids,
      outbidAlerts: outbidBids,
    })
  } catch (error) {
    console.error('Helper dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}
