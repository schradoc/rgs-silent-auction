import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const [prizes, bidders, recentBids, settings] = await Promise.all([
      prisma.prize.findMany({
        where: { isActive: true, parentPrizeId: null },
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: { select: { bids: true } },
          images: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.bidder.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { bids: true } },
        },
      }),
      prisma.bid.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          bidder: { select: { name: true, tableNumber: true } },
          prize: { select: { title: true, slug: true } },
        },
      }),
      prisma.auctionSettings.findUnique({ where: { id: 'settings' } }),
    ])

    const stats = {
      totalPrizes: prizes.length,
      totalBidders: bidders.length,
      totalBids: recentBids.length,
      totalValue: prizes.reduce((sum, p) => sum + p.currentHighestBid, 0),
    }

    return NextResponse.json({ prizes, bidders, recentBids, settings, stats })
  } catch (error) {
    console.error('Admin data error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
