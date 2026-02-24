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

    // Real database mode - all validation inside transaction with row-level locking
    const { prisma } = await import('@/lib/prisma')

    const result = await prisma.$transaction(async (tx) => {
      // Lock the prize row with SELECT FOR UPDATE to serialize concurrent bids
      // Include category and multiWinnerEligible for pledge logic
      const prizeRows = await tx.$queryRaw<Array<{
        id: string
        isActive: boolean
        currentHighestBid: number
        minimumBid: number
        category: string
        multiWinnerEligible: boolean
        multiWinnerSlots: number | null
      }>>`SELECT id, "isActive", "currentHighestBid", "minimumBid", "category", "multiWinnerEligible", "multiWinnerSlots" FROM "Prize" WHERE id = ${prizeId} FOR UPDATE`

      const prize = prizeRows[0]
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

      // Determine bid path: pledge, multi-winner competitive, or single-winner competitive
      const isPledge = prize.category === 'PLEDGES'
      const isMultiWinnerCompetitive = prize.multiWinnerEligible && !isPledge

      if (isPledge) {
        // Pledge: validate only against minimumBid, no outbid logic
        if (amount < prize.minimumBid) {
          return { error: `Minimum pledge is HK$${prize.minimumBid.toLocaleString()}`, status: 400, code: 'BID_TOO_LOW', minimumBid: prize.minimumBid }
        }
      } else {
        // Both multi-winner competitive and single-winner competitive use getMinimumNextBid
        const minimumBid = getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)
        if (amount < minimumBid) {
          return { error: `Minimum bid is HK$${minimumBid.toLocaleString()}`, status: 400, code: 'BID_TOO_LOW', minimumBid }
        }
      }

      // Verify bidder exists
      const bidder = await tx.bidder.findUnique({
        where: { id: bidderId },
      })

      if (!bidder) {
        return { error: 'Bidder not found. Please register again.', status: 404 }
      }

      let previousWinningBidderId: string | undefined
      const hadPreviousBid = prize.currentHighestBid > 0

      if (!isPledge && !isMultiWinnerCompetitive) {
        // Single-winner competitive: find previous winner and mark as outbid
        if (hadPreviousBid) {
          const previousWinningBid = await tx.bid.findFirst({
            where: { prizeId, status: 'WINNING' },
            select: { bidderId: true },
          })
          previousWinningBidderId = previousWinningBid?.bidderId

          await tx.bid.updateMany({
            where: { prizeId, status: 'WINNING' },
            data: { status: 'OUTBID' },
          })
        }
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

      // Multi-winner competitive: outbid the lowest winner if slots are full
      if (isMultiWinnerCompetitive && prize.multiWinnerSlots) {
        const winningBidsCount = await tx.bid.count({
          where: { prizeId, status: 'WINNING' },
        })

        if (winningBidsCount > prize.multiWinnerSlots) {
          // Find the lowest-amount WINNING bid (not the one we just created)
          const lowestWinningBid = await tx.bid.findFirst({
            where: { prizeId, status: 'WINNING' },
            orderBy: { amount: 'asc' },
            select: { id: true, bidderId: true },
          })

          if (lowestWinningBid && lowestWinningBid.id !== bid.id) {
            previousWinningBidderId = lowestWinningBid.bidderId
            await tx.bid.update({
              where: { id: lowestWinningBid.id },
              data: { status: 'OUTBID' },
            })
          }
        }
      }

      // Update prize highest bid if this bid is higher (for display)
      if (amount > prize.currentHighestBid) {
        await tx.prize.update({
          where: { id: prizeId },
          data: { currentHighestBid: amount },
        })
      }

      return { success: true, bid, previousWinningBidderId, hadPreviousBid, isPledge, isMultiWinnerCompetitive }
    })

    // Handle transaction errors returned as objects
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, ...(result.code && { code: result.code }), ...(result.minimumBid && { minimumBid: result.minimumBid }) },
        { status: result.status }
      )
    }

    // Send outbid notification to previous winner — must await on serverless
    if (!result.isPledge && result.previousWinningBidderId && result.previousWinningBidderId !== bidderId) {
      try {
        const { notifyOutbidBidders } = await import('@/lib/notifications')
        await notifyOutbidBidders(prizeId, amount, result.previousWinningBidderId)
      } catch (err) {
        console.error('Failed to send outbid notification:', err)
      }
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
