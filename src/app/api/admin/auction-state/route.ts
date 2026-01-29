import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get('admin_session')?.value === 'true'

    if (!isAdmin) {
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
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get('admin_session')?.value === 'true'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const body = await request.json()
    const { newState, force } = body

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

    return NextResponse.json({
      success: true,
      previousState: currentState,
      settings: updatedSettings,
    })
  } catch (error) {
    console.error('Update auction state error:', error)
    return NextResponse.json({ error: 'Failed to update auction state' }, { status: 500 })
  }
}
