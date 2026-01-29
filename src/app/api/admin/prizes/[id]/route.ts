import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Get single prize with full bid history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { prisma } = await import('@/lib/prisma')

    const prize = await prisma.prize.findUnique({
      where: { id },
      include: {
        bids: {
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
                tableNumber: true,
                email: true,
              },
            },
          },
          orderBy: { amount: 'desc' },
        },
        winners: {
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
                tableNumber: true,
              },
            },
            bid: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { bids: true },
        },
      },
    })

    if (!prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
    }

    // Get unique bidders count
    const uniqueBidders = new Set(prize.bids.map(b => b.bidderId)).size

    // Calculate bid statistics
    const bidAmounts = prize.bids.map(b => b.amount)
    const avgBid = bidAmounts.length > 0
      ? Math.round(bidAmounts.reduce((a, b) => a + b, 0) / bidAmounts.length)
      : 0

    return NextResponse.json({
      prize: {
        ...prize,
        stats: {
          totalBids: prize._count.bids,
          uniqueBidders,
          averageBid: avgBid,
          highestBid: prize.currentHighestBid,
        },
      },
    })
  } catch (error) {
    console.error('Get prize error:', error)
    return NextResponse.json({ error: 'Failed to get prize' }, { status: 500 })
  }
}
