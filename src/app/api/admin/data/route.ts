import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get(COOKIE_NAMES.adminSession)?.value
    const adminToken = cookieStore.get('admin_token')?.value

    // Debug logging
    console.log('Admin data request - cookies:', {
      adminSessionName: COOKIE_NAMES.adminSession,
      adminSessionValue: adminSession,
      hasAdminToken: !!adminToken,
      allCookies: cookieStore.getAll().map(c => ({ name: c.name, valueLength: c.value?.length }))
    })

    if (adminSession !== 'true') {
      return NextResponse.json({
        error: 'Unauthorized',
        debug: {
          expectedCookie: COOKIE_NAMES.adminSession,
          receivedValue: adminSession,
          hasToken: !!adminToken
        }
      }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const [prizes, bidders, recentBids, settings] = await Promise.all([
      prisma.prize.findMany({
        where: { isActive: true, parentPrizeId: null },
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: { select: { bids: true } },
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
