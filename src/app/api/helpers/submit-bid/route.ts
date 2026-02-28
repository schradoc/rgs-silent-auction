import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getMinimumNextBid, normalizeTableNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const HELPER_COOKIE = 'helper_id'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { bidderName, tableNumber, prizeId, amount, email, phone } = body

    // Validate required fields
    if (!bidderName || !tableNumber || !prizeId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bidderName, tableNumber, prizeId, amount' },
        { status: 400 }
      )
    }

    // Normalize the table number
    const normalizedTable = normalizeTableNumber(tableNumber)

    // Find or create bidder (outside transaction - not part of the race-sensitive path)
    let bidder = await prisma.bidder.findFirst({
      where: {
        name: { equals: bidderName, mode: 'insensitive' },
        tableNumber: normalizedTable,
      },
    })

    if (!bidder) {
      const generatedEmail = email || `${bidderName.toLowerCase().replace(/\s+/g, '.')}.table${normalizedTable}@guest.rgs-auction.hk`

      bidder = await prisma.bidder.create({
        data: {
          name: bidderName,
          tableNumber: normalizedTable,
          email: generatedEmail,
          phone: phone || null,
          emailVerified: false,
        },
      })
    } else if (phone && !bidder.phone) {
      await prisma.bidder.update({
        where: { id: bidder.id },
        data: { phone },
      })
    }

    const bidderId = bidder.id

    // All bid validation and creation inside interactive transaction with row locking
    const result = await prisma.$transaction(async (tx) => {
      // Check auction state with row lock to prevent bids after close
      const settingsRows = await tx.$queryRaw<Array<{ isAuctionOpen: boolean }>>`
        SELECT "isAuctionOpen" FROM "AuctionSettings" WHERE id = 'settings' FOR UPDATE`
      const settings = settingsRows[0]

      if (settings && !settings.isAuctionOpen) {
        return { error: 'The auction is currently closed', status: 400 }
      }

      // Lock the prize row with SELECT FOR UPDATE to serialize concurrent bids
      const prizeRows = await tx.$queryRaw<Array<{
        id: string
        title: string
        currentHighestBid: number
        minimumBid: number
        category: string
        multiWinnerEligible: boolean
        multiWinnerSlots: number | null
      }>>`SELECT id, title, "currentHighestBid", "minimumBid", "category", "multiWinnerEligible", "multiWinnerSlots" FROM "Prize" WHERE id = ${prizeId} FOR UPDATE`

      const prize = prizeRows[0]
      if (!prize) {
        return { error: 'Prize not found', status: 404 }
      }

      // Determine bid path: pledge, multi-winner competitive, or single-winner competitive
      const isPledge = prize.category === 'PLEDGES'
      const isMultiWinnerCompetitive = prize.multiWinnerEligible && !isPledge
      const minRequired = isPledge ? prize.minimumBid : getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)
      if (amount < minRequired) {
        return { error: `Bid must be at least HK$${minRequired.toLocaleString()}`, status: 400, minimumBid: minRequired }
      }

      let previousWinningBidderId: string | undefined
      const hadPreviousBid = prize.currentHighestBid > 0

      if (!isPledge && !isMultiWinnerCompetitive) {
        // Single-winner: outbid ALL previous winning bids (including same bidder's old bid)
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

      // For multi-winner: outbid any existing WINNING bid from the SAME bidder
      // (one person can only hold one winning slot per prize)
      if (isMultiWinnerCompetitive) {
        await tx.bid.updateMany({
          where: { prizeId, status: 'WINNING', bidderId },
          data: { status: 'OUTBID' },
        })
      }

      // Create the winning bid
      const bid = await tx.bid.create({
        data: {
          amount,
          bidderId,
          prizeId,
          helperId,
          status: 'WINNING',
        },
      })

      // Multi-winner competitive: outbid the lowest winner only if slots are full
      if (isMultiWinnerCompetitive && prize.multiWinnerSlots) {
        const winningBidsCount = await tx.bid.count({
          where: { prizeId, status: 'WINNING' },
        })

        if (winningBidsCount > prize.multiWinnerSlots) {
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

      // Update prize highest bid if this bid is higher
      if (amount > prize.currentHighestBid) {
        await tx.prize.update({
          where: { id: prizeId },
          data: { currentHighestBid: amount },
        })
      }

      return { success: true, bid, prize, hadPreviousBid, previousWinningBidderId, isPledge }
    })

    // Handle transaction errors
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, ...(result.minimumBid && { minimumBid: result.minimumBid }) },
        { status: result.status }
      )
    }

    // Fire-and-forget outbid notification — don't block the bid response
    if (!result.isPledge && result.previousWinningBidderId && result.previousWinningBidderId !== bidderId) {
      import('@/lib/notifications')
        .then(({ notifyOutbidBidders }) =>
          notifyOutbidBidders(prizeId, amount, result.previousWinningBidderId!)
        )
        .catch((err) => console.error('Failed to send outbid notification:', err))
    }

    return NextResponse.json({
      success: true,
      bid: {
        id: result.bid.id,
        amount: result.bid.amount,
        bidderName: bidder.name,
        tableNumber: bidder.tableNumber,
        prizeTitle: result.prize.title,
      },
    })
  } catch (error) {
    console.error('Helper submit bid error:', error)
    return NextResponse.json(
      { error: 'Failed to submit bid' },
      { status: 500 }
    )
  }
}
