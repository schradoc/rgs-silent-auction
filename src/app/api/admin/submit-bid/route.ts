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

    // Find or create bidder
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

    const result = await prisma.$transaction(async (tx) => {
      // Check auction state
      const settingsRows = await tx.$queryRaw<Array<{ isAuctionOpen: boolean }>>`
        SELECT "isAuctionOpen" FROM "AuctionSettings" WHERE id = 'settings' FOR UPDATE`
      const settings = settingsRows[0]

      // Admin can override closed auction — skip the check
      // (This is the backstop purpose of admin manual bids)

      // Lock prize row
      const prizeRows = await tx.$queryRaw<Array<{
        id: string; title: string; currentHighestBid: number; minimumBid: number
        category: string; multiWinnerEligible: boolean; multiWinnerSlots: number | null
      }>>`SELECT id, title, "currentHighestBid", "minimumBid", "category", "multiWinnerEligible", "multiWinnerSlots" FROM "Prize" WHERE id = ${prizeId} FOR UPDATE`

      const prize = prizeRows[0]
      if (!prize) {
        return { error: 'Prize not found', status: 404 }
      }

      const isPledge = prize.category === 'PLEDGES'
      const isMultiWinnerCompetitive = prize.multiWinnerEligible && !isPledge
      const minRequired = isPledge ? prize.minimumBid : getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)

      if (amount < minRequired) {
        return { error: `Bid must be at least HK$${minRequired.toLocaleString()}`, status: 400, minimumBid: minRequired }
      }

      let previousWinningBidderId: string | undefined
      const hadPreviousBid = prize.currentHighestBid > 0

      if (!isPledge && !isMultiWinnerCompetitive) {
        if (hadPreviousBid) {
          const previousWinningBid = await tx.bid.findFirst({
            where: { prizeId, status: 'WINNING' },
            select: { bidderId: true },
          })
          previousWinningBidderId = previousWinningBid?.bidderId

          await tx.bid.updateMany({
            where: { prizeId, status: 'WINNING', NOT: { bidderId } },
            data: { status: 'OUTBID' },
          })
        }
      }

      const bid = await tx.bid.create({
        data: {
          amount,
          bidderId,
          prizeId,
          helperId: null, // admin-submitted, no helper
          status: 'WINNING',
        },
      })

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

      if (amount > prize.currentHighestBid) {
        await tx.prize.update({
          where: { id: prizeId },
          data: { currentHighestBid: amount },
        })
      }

      return { success: true, bid, prize, hadPreviousBid, previousWinningBidderId, isPledge }
    })

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, ...(result.minimumBid && { minimumBid: result.minimumBid }) },
        { status: result.status }
      )
    }

    // Fire-and-forget outbid notification
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
    console.error('Admin submit bid error:', error)
    return NextResponse.json({ error: 'Failed to submit bid' }, { status: 500 })
  }
}
