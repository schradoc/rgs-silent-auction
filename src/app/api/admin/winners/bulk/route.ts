import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Bulk confirm all pending winners
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const { sendNotifications = true } = await request.json()

    // Get all active prizes with their winning bids that don't have confirmed winners yet
    const prizes = await prisma.prize.findMany({
      where: {
        isActive: true,
        parentPrizeId: null,
      },
      include: {
        bids: {
          where: { status: 'WINNING' },
          include: {
            bidder: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { amount: 'desc' },
          take: 1,
        },
        winners: true,
      },
    })

    // Filter to prizes that have a winning bid but no confirmed winner
    const pendingWinners = prizes.filter(
      (prize) => prize.bids.length > 0 && prize.winners.length === 0
    )

    const confirmed: string[] = []
    const errors: Array<{ prizeId: string; error: string }> = []

    for (const prize of pendingWinners) {
      const winningBid = prize.bids[0]
      if (!winningBid) continue

      try {
        // Create winner record
        const winner = await prisma.winner.create({
          data: {
            bidId: winningBid.id,
            prizeId: prize.id,
            bidderId: winningBid.bidder.id,
          },
        })

        confirmed.push(prize.id)

        // Send notification if requested
        if (sendNotifications) {
          try {
            const { sendWinnerNotification } = await import('@/lib/notifications')
            await sendWinnerNotification(winner.id)
          } catch (notifyError) {
            console.error(`Failed to send notification for prize ${prize.id}:`, notifyError)
            // Don't fail the whole operation if notification fails
          }
        }
      } catch (error) {
        console.error(`Failed to confirm winner for prize ${prize.id}:`, error)
        errors.push({
          prizeId: prize.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Log the bulk action
    await prisma.auditLog.create({
      data: {
        action: 'BULK_WINNERS_CONFIRMED',
        entityType: 'Winner',
        details: JSON.stringify({
          confirmed: confirmed.length,
          errors: errors.length,
          sendNotifications,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      confirmed: confirmed.length,
      errors,
      total: pendingWinners.length,
    })
  } catch (error) {
    console.error('Bulk confirm winners error:', error)
    return NextResponse.json({ error: 'Failed to confirm winners' }, { status: 500 })
  }
}
