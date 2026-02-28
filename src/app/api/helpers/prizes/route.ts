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
    })

    if (!helper) {
      return NextResponse.json({ error: 'Helper not found' }, { status: 404 })
    }

    // Get all active prizes with their bids and bidder info
    const prizes = await prisma.prize.findMany({
      where: { isActive: true, parentPrizeId: null },
      include: {
        bids: {
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
                tableNumber: true,
                phone: true,
                email: true,
              },
            },
          },
          orderBy: { amount: 'desc' },
        },
        _count: { select: { bids: true } },
      },
      orderBy: [{ lotNumber: 'asc' }, { title: 'asc' }],
    })

    // Format for helper view
    const formatted = prizes.map((prize) => {
      const winningBids = prize.bids.filter(b => b.status === 'WINNING')
      const outbidBids = prize.bids.filter(b => b.status === 'OUTBID')
      return {
        id: prize.id,
        title: prize.title,
        lotNumber: prize.lotNumber,
        subLotLetter: prize.subLotLetter,
        category: prize.category,
        minimumBid: prize.minimumBid,
        currentHighestBid: prize.currentHighestBid,
        multiWinnerEligible: prize.multiWinnerEligible,
        multiWinnerSlots: prize.multiWinnerSlots,
        totalBids: prize._count.bids,
        winningBids: winningBids.map(b => ({
          id: b.id,
          amount: b.amount,
          createdAt: b.createdAt.toISOString(),
          bidder: b.bidder,
        })),
        recentOutbid: outbidBids.slice(0, 3).map(b => ({
          id: b.id,
          amount: b.amount,
          createdAt: b.createdAt.toISOString(),
          bidder: b.bidder,
        })),
      }
    })

    return NextResponse.json({ prizes: formatted })
  } catch (error) {
    console.error('Helper prizes error:', error)
    return NextResponse.json({ error: 'Failed to fetch prizes' }, { status: 500 })
  }
}
