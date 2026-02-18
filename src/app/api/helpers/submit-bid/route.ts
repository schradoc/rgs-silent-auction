import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
    const { bidderName, tableNumber, prizeId, amount, email, phone, isPaperBid, imageUrl } = body

    // Validate required fields
    if (!bidderName || !tableNumber || !prizeId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bidderName, tableNumber, prizeId, amount' },
        { status: 400 }
      )
    }

    // Find or create bidder (outside transaction - not part of the race-sensitive path)
    let bidder = await prisma.bidder.findFirst({
      where: {
        name: { equals: bidderName, mode: 'insensitive' },
        tableNumber,
      },
    })

    if (!bidder) {
      const generatedEmail = email || `${bidderName.toLowerCase().replace(/\s+/g, '.')}.table${tableNumber}@guest.rgs-auction.hk`

      bidder = await prisma.bidder.create({
        data: {
          name: bidderName,
          tableNumber,
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

    // All bid validation and creation inside interactive transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch prize inside transaction for consistency
      const prize = await tx.prize.findUnique({
        where: { id: prizeId },
      })

      if (!prize) {
        return { error: 'Prize not found', status: 404 }
      }

      // Validate bid amount with fresh data
      const minRequired = Math.max(prize.minimumBid, prize.currentHighestBid + 100)
      if (amount < minRequired) {
        return { error: `Bid must be at least HK$${minRequired.toLocaleString()}`, status: 400, minimumBid: minRequired }
      }

      const hadPreviousBid = prize.currentHighestBid > 0

      // Mark previous winning bids as outbid
      await tx.bid.updateMany({
        where: {
          prizeId,
          status: 'WINNING',
          NOT: { bidderId },
        },
        data: { status: 'OUTBID' },
      })

      // Create the winning bid
      const bid = await tx.bid.create({
        data: {
          amount,
          bidderId,
          prizeId,
          helperId,
          isPaperBid: isPaperBid || false,
          status: 'WINNING',
        },
      })

      // Update prize highest bid
      await tx.prize.update({
        where: { id: prizeId },
        data: { currentHighestBid: amount },
      })

      return { success: true, bid, prize, hadPreviousBid }
    })

    // Handle transaction errors
    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, ...(result.minimumBid && { minimumBid: result.minimumBid }) },
        { status: result.status }
      )
    }

    // If paper bid, create paper bid record
    if (isPaperBid) {
      await prisma.paperBid.create({
        data: {
          imageUrl: imageUrl || null,
          tableNumber,
          bidderName,
          prizeId,
          amount,
          email: email || null,
          phone: phone || null,
          notifyIfOutbid: !!phone || !!email,
          helperId,
          bidId: result.bid.id,
        },
      })
    }

    // Send outbid notifications (async, don't await)
    if (result.hadPreviousBid) {
      import('@/lib/notifications').then(({ notifyOutbidBidders }) => {
        notifyOutbidBidders(prizeId, amount).catch(console.error)
      })
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
