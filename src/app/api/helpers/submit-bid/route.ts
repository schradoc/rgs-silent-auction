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

    // Get the prize
    const prize = await prisma.prize.findUnique({
      where: { id: prizeId },
    })

    if (!prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
    }

    // Validate bid amount
    const minRequired = Math.max(prize.minimumBid, prize.currentHighestBid + 100)
    if (amount < minRequired) {
      return NextResponse.json(
        { error: `Bid must be at least HK$${minRequired.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Find or create bidder
    let bidder = await prisma.bidder.findFirst({
      where: {
        name: { equals: bidderName, mode: 'insensitive' },
        tableNumber,
      },
    })

    if (!bidder) {
      // Create new bidder with generated email if not provided
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
      // Update phone if provided and not already set
      await prisma.bidder.update({
        where: { id: bidder.id },
        data: { phone },
      })
    }

    // Create the bid
    const [bid] = await prisma.$transaction([
      // Create the bid
      prisma.bid.create({
        data: {
          amount,
          bidderId: bidder.id,
          prizeId,
          helperId,
          isPaperBid: isPaperBid || false,
          status: 'WINNING',
        },
      }),
      // Update prize highest bid
      prisma.prize.update({
        where: { id: prizeId },
        data: { currentHighestBid: amount },
      }),
      // Mark previous winning bids as outbid
      prisma.bid.updateMany({
        where: {
          prizeId,
          status: 'WINNING',
          NOT: { bidderId: bidder.id },
        },
        data: { status: 'OUTBID' },
      }),
    ])

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
          bidId: bid.id,
        },
      })
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
    console.error('Helper submit bid error:', error)
    return NextResponse.json(
      { error: 'Failed to submit bid' },
      { status: 500 }
    )
  }
}
