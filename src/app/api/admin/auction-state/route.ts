import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const VALID_STATES = ['DRAFT', 'TESTING', 'PRELAUNCH', 'LIVE', 'CLOSED'] as const
type AuctionState = typeof VALID_STATES[number]

// State transition rules
const ALLOWED_TRANSITIONS: Record<AuctionState, AuctionState[]> = {
  DRAFT: ['TESTING', 'PRELAUNCH'],
  TESTING: ['DRAFT', 'PRELAUNCH'],
  PRELAUNCH: ['TESTING', 'LIVE'],
  LIVE: ['CLOSED'],
  CLOSED: ['LIVE'], // Allow reopening if needed
}

// Get current auction state
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const settings = await prisma.auctionSettings.findUnique({
      where: { id: 'settings' },
    })

    if (!settings) {
      // Create default settings
      const newSettings = await prisma.auctionSettings.create({
        data: {
          id: 'settings',
          auctionState: 'DRAFT',
          isAuctionOpen: false,
        },
      })
      return NextResponse.json({ settings: newSettings })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get auction state error:', error)
    return NextResponse.json({ error: 'Failed to get auction state' }, { status: 500 })
  }
}

// Update auction state
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const body = await request.json()
    const { newState, force, autoConfirmWinners } = body

    if (!VALID_STATES.includes(newState)) {
      return NextResponse.json({ error: 'Invalid auction state' }, { status: 400 })
    }

    // Get current state
    let settings = await prisma.auctionSettings.findUnique({
      where: { id: 'settings' },
    })

    if (!settings) {
      settings = await prisma.auctionSettings.create({
        data: {
          id: 'settings',
          auctionState: 'DRAFT',
          isAuctionOpen: false,
        },
      })
    }

    const currentState = settings.auctionState as AuctionState

    // Check if transition is allowed
    if (!force && !ALLOWED_TRANSITIONS[currentState].includes(newState)) {
      return NextResponse.json({
        error: `Cannot transition from ${currentState} to ${newState}`,
        allowedTransitions: ALLOWED_TRANSITIONS[currentState],
      }, { status: 400 })
    }

    // Validate state-specific requirements
    if (newState === 'LIVE') {
      // Check we have prizes
      const prizeCount = await prisma.prize.count({ where: { isActive: true } })
      if (prizeCount === 0) {
        return NextResponse.json({
          error: 'Cannot go LIVE without any active prizes',
        }, { status: 400 })
      }
    }

    // Update state and related fields
    const isAuctionOpen = newState === 'LIVE'

    const updatedSettings = await prisma.auctionSettings.update({
      where: { id: 'settings' },
      data: {
        auctionState: newState,
        isAuctionOpen,
        // Set start time when going live
        ...(newState === 'LIVE' && !settings.auctionStartTime
          ? { auctionStartTime: new Date() }
          : {}),
      },
    })

    // Log the state change
    await prisma.auditLog.create({
      data: {
        action: 'STATE_CHANGED',
        entityType: 'AuctionSettings',
        entityId: 'settings',
        details: JSON.stringify({
          from: currentState,
          to: newState,
          timestamp: new Date().toISOString(),
        }),
      },
    })

    // Auto-confirm winners if requested when closing
    let winnersConfirmed = 0
    if (newState === 'CLOSED' && autoConfirmWinners) {
      // Get all prizes with winning bids that don't have confirmed winners
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

      for (const prize of pendingWinners) {
        const winningBid = prize.bids[0]
        if (!winningBid) continue

        try {
          const winner = await prisma.winner.create({
            data: {
              bidId: winningBid.id,
              prizeId: prize.id,
              bidderId: winningBid.bidder.id,
            },
          })

          winnersConfirmed++

          // Send notification
          try {
            const { sendWinnerNotification } = await import('@/lib/notifications')
            await sendWinnerNotification(winner.id)
          } catch (notifyError) {
            console.error(`Failed to send notification for prize ${prize.id}:`, notifyError)
          }
        } catch (error) {
          console.error(`Failed to confirm winner for prize ${prize.id}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      previousState: currentState,
      settings: updatedSettings,
      winnersConfirmed: winnersConfirmed > 0 ? winnersConfirmed : undefined,
    })
  } catch (error) {
    console.error('Update auction state error:', error)
    return NextResponse.json({ error: 'Failed to update auction state' }, { status: 500 })
  }
}
