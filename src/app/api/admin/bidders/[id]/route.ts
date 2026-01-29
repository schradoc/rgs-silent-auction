import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Get single bidder with full bid history
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

    const bidder = await prisma.bidder.findUnique({
      where: { id },
      include: {
        bids: {
          include: {
            prize: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        winners: {
          include: {
            prize: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: { bids: true },
        },
      },
    })

    if (!bidder) {
      return NextResponse.json({ error: 'Bidder not found' }, { status: 404 })
    }

    // Calculate total bid amount
    const totalBidAmount = bidder.bids.reduce((sum, bid) => sum + bid.amount, 0)

    return NextResponse.json({
      bidder: {
        ...bidder,
        totalBidAmount,
      },
    })
  } catch (error) {
    console.error('Get bidder error:', error)
    return NextResponse.json({ error: 'Failed to get bidder' }, { status: 500 })
  }
}
