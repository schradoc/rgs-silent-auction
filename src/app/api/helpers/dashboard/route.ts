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

    const assignedTablesList = helper.assignedTables
      ? helper.assignedTables.split(',').map((t) => t.trim()).filter(Boolean)
      : []

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
      },
    })

    // Calculate stats for each helper
    const leaderboard = helpers.map((h) => {
      const totalBids = h.bidsPrompted.length
      const totalValue = h.bidsPrompted.reduce((sum, b) => sum + b.amount, 0)
      const uniqueBidders = new Set(h.bidsPrompted.map((b) => b.bidderId)).size
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
        streak,
        isCurrentHelper: h.id === helperId,
      }
    })

    leaderboard.sort((a, b) => {
      if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue
      return b.totalBids - a.totalBids
    })

    const rankedLeaderboard = leaderboard.map((h, index) => ({
      ...h,
      rank: index + 1,
    }))

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

    // ── Outbid alerts: ALL outbid bids at assigned tables (not just this helper's bidders) ──
    const outbidBids = await prisma.bid.findMany({
      where: {
        status: 'OUTBID',
        ...(assignedTablesList.length > 0
          ? { bidder: { tableNumber: { in: assignedTablesList } } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        bidder: { select: { name: true, tableNumber: true } },
        prize: { select: { title: true, slug: true, currentHighestBid: true, lotNumber: true } },
      },
    })

    // ── Table activity: all WINNING/OUTBID bids grouped by table, with timestamps ──
    const tableBids = await prisma.bid.findMany({
      where: {
        status: { in: ['WINNING', 'OUTBID'] },
        bidder: { tableNumber: { not: null } },
      },
      include: {
        bidder: { select: { name: true, tableNumber: true } },
        prize: { select: { title: true, lotNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const tableMap = new Map<
      string,
      {
        winningCount: number
        outbidCount: number
        totalValue: number
        bids: Array<{
          bidderName: string
          prizeTitle: string
          lotNumber: number | null
          amount: number
          status: string
          createdAt: string
        }>
      }
    >()
    for (const bid of tableBids) {
      const table = bid.bidder.tableNumber!
      if (!tableMap.has(table)) {
        tableMap.set(table, { winningCount: 0, outbidCount: 0, totalValue: 0, bids: [] })
      }
      const entry = tableMap.get(table)!
      if (bid.status === 'WINNING') {
        entry.winningCount++
        entry.totalValue += bid.amount
      } else {
        entry.outbidCount++
      }
      entry.bids.push({
        bidderName: bid.bidder.name,
        prizeTitle: bid.prize.title,
        lotNumber: bid.prize.lotNumber,
        amount: bid.amount,
        status: bid.status,
        createdAt: bid.createdAt.toISOString(),
      })
    }

    const tableActivity = Array.from(tableMap.entries())
      .map(([tableNumber, data]) => ({ tableNumber, ...data }))
      .sort((a, b) => b.outbidCount - a.outbidCount || b.winningCount - a.winningCount)

    // ── Live feed: most recent 30 bids across ALL tables, chronological ──
    const liveFeed = await prisma.bid.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        bidder: { select: { name: true, tableNumber: true } },
        prize: { select: { title: true, slug: true, lotNumber: true, currentHighestBid: true } },
      },
    })

    return NextResponse.json({
      helper: {
        id: helper.id,
        name: helper.name,
        avatarColor: helper.avatarColor,
        assignedTables: helper.assignedTables,
      },
      stats: currentHelperStats,
      leaderboard: rankedLeaderboard,
      recentBids,
      outbidAlerts: outbidBids,
      tableActivity,
      liveFeed: liveFeed.map((b) => ({
        id: b.id,
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        bidderName: b.bidder.name,
        tableNumber: b.bidder.tableNumber,
        prizeTitle: b.prize.title,
        lotNumber: b.prize.lotNumber,
        currentHighestBid: b.prize.currentHighestBid,
      })),
    })
  } catch (error) {
    console.error('Helper dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    )
  }
}
