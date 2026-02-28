import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/admin/bids?bidId=...
 *
 * Deletes a specific bid and recalculates winner status for the prize.
 * Uses SELECT FOR UPDATE to prevent race conditions during recalculation.
 *
 * Recalculation logic:
 * - Single-winner: if deleted bid was WINNING, promote next-highest OUTBID bid
 * - Multi-winner: if deleted bid was WINNING and slots are now underfilled, promote highest OUTBID
 * - Pledges: just delete, recalculate currentHighestBid
 * - Always recalculates currentHighestBid from remaining WINNING bids
 * - Deletes any associated Winner record first
 */
export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminSession()
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const bidId = searchParams.get('bidId')
  if (!bidId) {
    return NextResponse.json({ error: 'bidId is required' }, { status: 400 })
  }

  const { prisma } = await import('@/lib/prisma')

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the bid with its prize details
      const bid = await tx.bid.findUnique({
        where: { id: bidId },
        include: {
          prize: {
            select: {
              id: true,
              title: true,
              category: true,
              multiWinnerEligible: true,
              multiWinnerSlots: true,
              currentHighestBid: true,
              minimumBid: true,
            },
          },
          winner: true,
          bidder: { select: { id: true, name: true } },
        },
      })

      if (!bid) {
        throw new Error('Bid not found')
      }

      const { prize } = bid
      const isPledge = prize.category === 'PLEDGES'
      const wasWinning = bid.status === 'WINNING' || bid.status === 'WON'

      // 2. Lock the prize row for concurrent safety
      await tx.$queryRaw`SELECT id FROM "Prize" WHERE id = ${prize.id} FOR UPDATE`

      // 3. Delete Winner record if it exists
      if (bid.winner) {
        await tx.winner.delete({ where: { id: bid.winner.id } })
      }

      // 4. Delete the bid itself
      await tx.bid.delete({ where: { id: bidId } })

      // 5. Recalculate winner status if the deleted bid was winning
      let promotedBid = null

      if (wasWinning && !isPledge) {
        if (prize.multiWinnerEligible) {
          // Multi-winner: check if we need to promote someone
          const remainingWinningCount = await tx.bid.count({
            where: { prizeId: prize.id, status: 'WINNING' },
          })

          const slots = prize.multiWinnerSlots ?? Infinity
          if (remainingWinningCount < slots) {
            // Promote the highest OUTBID bid
            const highestOutbid = await tx.bid.findFirst({
              where: { prizeId: prize.id, status: 'OUTBID' },
              orderBy: { amount: 'desc' },
              include: { bidder: { select: { id: true, name: true } } },
            })

            if (highestOutbid) {
              await tx.bid.update({
                where: { id: highestOutbid.id },
                data: { status: 'WINNING' },
              })
              promotedBid = highestOutbid
            }
          }
        } else {
          // Single-winner: promote next-highest OUTBID bid
          const highestOutbid = await tx.bid.findFirst({
            where: { prizeId: prize.id, status: 'OUTBID' },
            orderBy: { amount: 'desc' },
            include: { bidder: { select: { id: true, name: true } } },
          })

          if (highestOutbid) {
            await tx.bid.update({
              where: { id: highestOutbid.id },
              data: { status: 'WINNING' },
            })
            promotedBid = highestOutbid
          }
        }
      }

      // 6. Recalculate currentHighestBid from remaining WINNING bids
      const highestRemaining = await tx.bid.findFirst({
        where: { prizeId: prize.id, status: 'WINNING' },
        orderBy: { amount: 'desc' },
      })

      const newHighestBid = highestRemaining?.amount ?? 0

      await tx.prize.update({
        where: { id: prize.id },
        data: { currentHighestBid: newHighestBid },
      })

      return {
        deletedBid: {
          id: bid.id,
          amount: bid.amount,
          status: bid.status,
          bidderName: bid.bidder.name,
        },
        prize: {
          id: prize.id,
          title: prize.title,
          previousHighestBid: prize.currentHighestBid,
          newHighestBid,
        },
        promotedBid: promotedBid
          ? {
              id: promotedBid.id,
              amount: promotedBid.amount,
              bidderName: promotedBid.bidder.name,
            }
          : null,
        hadWinnerRecord: !!bid.winner,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Bid deleted. ${
        result.promotedBid
          ? `${result.promotedBid.bidderName}'s bid of HK$${result.promotedBid.amount.toLocaleString()} is now winning.`
          : result.prize.newHighestBid > 0
          ? `Highest bid is now HK$${result.prize.newHighestBid.toLocaleString()}.`
          : 'No remaining bids on this prize.'
      }`,
      ...result,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete bid'
    console.error('Admin bid deletion error:', error)

    if (errorMessage === 'Bid not found') {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
