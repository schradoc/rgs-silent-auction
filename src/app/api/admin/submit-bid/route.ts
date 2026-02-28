import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { getMinimumNextBid, normalizeTableNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await verifyAdminSession()
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    const body = await request.json()
    const { bidderName, tableNumber, prizeId, amount, email, phone } = body

    if (!bidderName || !tableNumber || !prizeId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bidderName, tableNumber, prizeId, amount' },
        { status: 400 }
      )
    }

    const normalizedTable = normalizeTableNumber(tableNumber)

    // Find or create bidder (outside transaction — safe for admin)
    let bidder = await prisma.bidder.findFirst({
      where: {
        name: { equals: bidderName, mode: 'insensitive' },
        tableNumber: normalizedTable,
      },
    })

    if (!bidder) {
      const baseName = bidderName.trim().toLowerCase().replace(/\s+/g, '.')
      const generatedEmail = email || `${baseName}.table${normalizedTable}.${Date.now()}@guest.rgs-auction.hk`
      try {
        bidder = await prisma.bidder.create({
          data: {
            name: bidderName.trim(),
            tableNumber: normalizedTable,
            email: generatedEmail,
            phone: phone || null,
            emailVerified: false,
          },
        })
      } catch (createErr: unknown) {
        if (phone && typeof createErr === 'object' && createErr !== null && 'code' in createErr && (createErr as { code: string }).code === 'P2002') {
          bidder = await prisma.bidder.findFirst({
            where: { phone },
          })
          if (!bidder) throw createErr
        } else {
          throw createErr
        }
      }
    } else if (phone && !bidder.phone) {
      await prisma.bidder.update({
        where: { id: bidder.id },
        data: { phone },
      })
    }

    const bidderId = bidder.id

    // Admin bids bypass auction-closed restrictions entirely.
    // Use regular Prisma queries (no raw SQL FOR UPDATE) for PgBouncer compatibility.
    const prize = await prisma.prize.findUnique({
      where: { id: prizeId },
      select: {
        id: true,
        title: true,
        currentHighestBid: true,
        minimumBid: true,
        category: true,
        multiWinnerEligible: true,
        multiWinnerSlots: true,
      },
    })

    if (!prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
    }

    const isPledge = prize.category === 'PLEDGES'
    const isMultiWinnerCompetitive = prize.multiWinnerEligible && !isPledge
    const minRequired = isPledge ? prize.minimumBid : getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)

    if (amount < minRequired) {
      return NextResponse.json(
        { error: `Bid must be at least HK$${minRequired.toLocaleString()}`, minimumBid: minRequired },
        { status: 400 }
      )
    }

    // Use a simple transaction for the bid operations (no raw SQL needed)
    let previousWinningBidderId: string | undefined
    const hadPreviousBid = prize.currentHighestBid > 0

    if (!isPledge && !isMultiWinnerCompetitive) {
      // Single-winner: outbid ALL previous winning bids
      if (hadPreviousBid) {
        const previousWinningBid = await prisma.bid.findFirst({
          where: { prizeId, status: 'WINNING' },
          select: { bidderId: true },
        })
        previousWinningBidderId = previousWinningBid?.bidderId

        await prisma.bid.updateMany({
          where: { prizeId, status: 'WINNING' },
          data: { status: 'OUTBID' },
        })
      }
    }

    // For multi-winner: outbid any existing WINNING bid from the SAME bidder
    if (isMultiWinnerCompetitive) {
      await prisma.bid.updateMany({
        where: { prizeId, status: 'WINNING', bidderId },
        data: { status: 'OUTBID' },
      })
    }

    const bid = await prisma.bid.create({
      data: {
        amount,
        bidderId,
        prizeId,
        helperId: null,
        status: 'WINNING',
      },
    })

    if (isMultiWinnerCompetitive && prize.multiWinnerSlots) {
      const winningBidsCount = await prisma.bid.count({
        where: { prizeId, status: 'WINNING' },
      })

      if (winningBidsCount > prize.multiWinnerSlots) {
        const lowestWinningBid = await prisma.bid.findFirst({
          where: { prizeId, status: 'WINNING' },
          orderBy: { amount: 'asc' },
          select: { id: true, bidderId: true },
        })

        if (lowestWinningBid && lowestWinningBid.id !== bid.id) {
          previousWinningBidderId = lowestWinningBid.bidderId
          await prisma.bid.update({
            where: { id: lowestWinningBid.id },
            data: { status: 'OUTBID' },
          })
        }
      }
    }

    if (amount > prize.currentHighestBid) {
      await prisma.prize.update({
        where: { id: prizeId },
        data: { currentHighestBid: amount },
      })
    }

    // Fire-and-forget outbid notification
    if (!isPledge && previousWinningBidderId && previousWinningBidderId !== bidderId) {
      import('@/lib/notifications')
        .then(({ notifyOutbidBidders }) =>
          notifyOutbidBidders(prizeId, amount, previousWinningBidderId!)
        )
        .catch((err) => console.error('Failed to send outbid notification:', err))
    }

    return NextResponse.json({
      success: true,
      bid: {
        id: bid.id,
        amount: bid.amount,
        bidderName: bidder.name,
        tableNumber: bidder.tableNumber,
        prizeTitle: prize.title,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Admin submit bid error:', message, error)
    return NextResponse.json({ error: `Failed to submit bid: ${message}` }, { status: 500 })
  }
}
