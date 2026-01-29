import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// Get all winners or potential winners
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get(COOKIE_NAMES.adminSession)?.value === 'true'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'confirmed' | 'potential' | 'all'

    if (status === 'confirmed') {
      // Get confirmed winners
      const winners = await prisma.winner.findMany({
        include: {
          bid: true,
          bidder: {
            select: { id: true, name: true, email: true, tableNumber: true },
          },
          prize: {
            select: { id: true, title: true, slug: true, minimumBid: true },
          },
        },
        orderBy: { acceptedAt: 'desc' },
      })

      return NextResponse.json({ winners })
    }

    // Get all prizes with their winning bids (potential winners)
    const prizes = await prisma.prize.findMany({
      where: { isActive: true, parentPrizeId: null },
      include: {
        bids: {
          where: { status: 'WINNING' },
          include: {
            bidder: {
              select: { id: true, name: true, email: true, tableNumber: true },
            },
          },
          orderBy: { amount: 'desc' },
          take: 1,
        },
        winners: {
          include: {
            bidder: {
              select: { id: true, name: true, tableNumber: true },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    })

    // Format as potential winners
    const potentialWinners = prizes.map((prize) => ({
      prizeId: prize.id,
      prizeTitle: prize.title,
      prizeSlug: prize.slug,
      minimumBid: prize.minimumBid,
      currentHighestBid: prize.currentHighestBid,
      winningBid: prize.bids[0] || null,
      isConfirmed: prize.winners.length > 0,
      confirmedWinners: prize.winners,
      multiWinnerEligible: prize.multiWinnerEligible,
      multiWinnerSlots: prize.multiWinnerSlots,
    }))

    return NextResponse.json({ potentialWinners })
  } catch (error) {
    console.error('Get winners error:', error)
    return NextResponse.json({ error: 'Failed to get winners' }, { status: 500 })
  }
}

// Confirm a winner
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get(COOKIE_NAMES.adminSession)?.value === 'true'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const { bidId, prizeId, bidderId, sendNotification } = await request.json()

    if (!bidId || !prizeId || !bidderId) {
      return NextResponse.json(
        { error: 'bidId, prizeId, and bidderId are required' },
        { status: 400 }
      )
    }

    // Check if winner already exists
    const existingWinner = await prisma.winner.findFirst({
      where: { prizeId, bidderId },
    })

    if (existingWinner) {
      return NextResponse.json(
        { error: 'Winner already confirmed for this prize' },
        { status: 400 }
      )
    }

    // Create winner record
    const winner = await prisma.winner.create({
      data: {
        bidId,
        prizeId,
        bidderId,
      },
      include: {
        bid: true,
        bidder: true,
        prize: true,
      },
    })

    // Send notification if requested
    if (sendNotification) {
      const { sendWinnerNotification } = await import('@/lib/notifications')
      await sendWinnerNotification(winner.id)
    }

    return NextResponse.json({ success: true, winner })
  } catch (error) {
    console.error('Confirm winner error:', error)
    return NextResponse.json({ error: 'Failed to confirm winner' }, { status: 500 })
  }
}

// Remove a winner (undo confirmation)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get(COOKIE_NAMES.adminSession)?.value === 'true'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const { searchParams } = new URL(request.url)
    const winnerId = searchParams.get('winnerId')

    if (!winnerId) {
      return NextResponse.json({ error: 'winnerId is required' }, { status: 400 })
    }

    await prisma.winner.delete({
      where: { id: winnerId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove winner error:', error)
    return NextResponse.json({ error: 'Failed to remove winner' }, { status: 500 })
  }
}
