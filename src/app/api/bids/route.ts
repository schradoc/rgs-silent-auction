import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'
import { getMinimumNextBid } from '@/lib/utils'
import { mockPrizes } from '@/lib/mock-data'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const isDatabaseConfigured = !!process.env.DATABASE_URL

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value

    if (!bidderId) {
      return NextResponse.json(
        { error: 'Please register to place a bid' },
        { status: 401 }
      )
    }

    // Rate limit by bidder
    const rl = checkRateLimit(`bid:${bidderId}`, RATE_LIMITS.bidSubmit)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const body = await request.json()
    const { prizeId, amount } = body

    if (!prizeId || !amount) {
      return NextResponse.json(
        { error: 'Prize ID and amount are required' },
        { status: 400 }
      )
    }

    // Demo mode - just return success
    if (!isDatabaseConfigured) {
      const mockPrize = mockPrizes.find(p => p.id === prizeId)
      if (!mockPrize) {
        return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
      }

      const minimumBid = getMinimumNextBid(mockPrize.currentHighestBid, mockPrize.minimumBid)
      if (amount < minimumBid) {
        return NextResponse.json(
          { error: `Minimum bid is HK$${minimumBid.toLocaleString()}` },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        bid: {
          id: `demo-${Date.now()}`,
          amount,
          prizeId,
          bidderId,
          status: 'WINNING',
          createdAt: new Date().toISOString(),
        },
        _demo: true,
      })
    }

    // Real database mode - all validation inside transaction to prevent races
    const { prisma } = await import('@/lib/prisma')

    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch prize inside transaction for consistency
      const prize = await tx.prize.findUnique({
        where: { id: prizeId },
      })

      if (!prize) {
        return { error: 'Prize not found', status: 404 }
      }

      if (!prize.isActive) {
        return { error: 'This prize is no longer available for bidding', status: 400 }
      }

      // Check auction state inside transaction
      const settings = await tx.auctionSettings.findUnique({
        where: { id: 'settings' },
      })

      if (settings && !settings.isAuctionOpen) {
        return { error: 'The auction is currently closed', status: 400 }
      }

      // Validate minimum bid with fresh data
      const minimumBid = getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)
      if (amount < minimumBid) {
        return { error: `Minimum bid is HK$${minimumBid.toLocaleString()}`, status: 400, code: 'BID_TOO_LOW', minimumBid }
      }

      // Verify bidder exists
      const bidder = await tx.bidder.findUnique({
        where: { id: bidderId },
      })

      if (!bidder) {
        return { error: 'Bidder not found. Please register again.', status: 404 }
      }

      const hadPreviousBid = prize.currentHighestBid > 0

      // Find previous winner INSIDE transaction
      let previousWinningBidderId: string | undefined
      if (hadPreviousBid) {
        const previousWinningBid = await tx.bid.findFirst({
          where: { prizeId, status: 'WINNING' },
          select: { bidderId: true },
        })
        previousWinningBidderId = previousWinningBid?.bidderId
      }

      // Mark previous winning bids as outbid
      if (hadPreviousBid) {
        await tx.bid.updateMany({
          where: { prizeId, status: 'WINNING' },
          data: { status: 'OUTBID' },
        })
      }

      // Create the new winning bid
      const bid = await tx.bid.create({
        data: {
          amount,
          bidderId,
          prizeId,
          status: 'WINNING',
        },
      })

      // Update prize highest bid
      await tx.prize.update({
        where: { id: prizeId },
        data: { currentHighestBid: amount },
      })

      return { success: true, bid, previousWinningBidderId, hadPreviousBid }
    })

    // Handle transaction errors returned as objects
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, ...(result.code && { code: result.code }), ...(result.minimumBid && { minimumBid: result.minimumBid }) },
        { status: result.status }
      )
    }

    // Send outbid notification to previous winner (async, don't await)
    if (result.hadPreviousBid && result.previousWinningBidderId && result.previousWinningBidderId !== bidderId) {
      import('@/lib/notifications').then(({ notifyOutbidBidders }) => {
        notifyOutbidBidders(prizeId, amount, result.previousWinningBidderId).catch(console.error)
      })
    }

    return NextResponse.json({ success: true, bid: result.bid })
  } catch (error) {
    logger.error('Bid placement failed', error)
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseConfigured) {
      return NextResponse.json({ bids: [], _demo: true })
    }

    const { prisma } = await import('@/lib/prisma')
    const { searchParams } = new URL(request.url)
    const prizeId = searchParams.get('prizeId')
    const bidderId = searchParams.get('bidderId')

    const where: Record<string, string> = {}
    if (prizeId) where.prizeId = prizeId
    if (bidderId) where.bidderId = bidderId

    const bids = await prisma.bid.findMany({
      where,
      include: {
        bidder: { select: { name: true, tableNumber: true } },
        prize: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ bids })
  } catch (error) {
    logger.error('Failed to fetch bids', error)
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
  }
}
