import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'
import { getMinimumNextBid } from '@/lib/utils'

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

    const body = await request.json()
    const { prizeId, amount } = body

    if (!prizeId || !amount) {
      return NextResponse.json(
        { error: 'Prize ID and amount are required' },
        { status: 400 }
      )
    }

    // Get the prize and validate bid
    const prize = await prisma.prize.findUnique({
      where: { id: prizeId },
    })

    if (!prize) {
      return NextResponse.json(
        { error: 'Prize not found' },
        { status: 404 }
      )
    }

    if (!prize.isActive) {
      return NextResponse.json(
        { error: 'This prize is no longer available for bidding' },
        { status: 400 }
      )
    }

    // Check auction settings
    const settings = await prisma.auctionSettings.findUnique({
      where: { id: 'settings' },
    })

    if (settings && !settings.isAuctionOpen) {
      return NextResponse.json(
        { error: 'The auction is currently closed' },
        { status: 400 }
      )
    }

    // Validate minimum bid
    const minimumBid = getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)
    if (amount < minimumBid) {
      return NextResponse.json(
        { error: `Minimum bid is HK$${minimumBid.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Verify bidder exists
    const bidder = await prisma.bidder.findUnique({
      where: { id: bidderId },
    })

    if (!bidder) {
      return NextResponse.json(
        { error: 'Bidder not found. Please register again.' },
        { status: 404 }
      )
    }

    // Create the bid and update prize in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark previous highest bid as outbid
      if (prize.currentHighestBid > 0) {
        await tx.bid.updateMany({
          where: {
            prizeId,
            status: 'WINNING',
          },
          data: {
            status: 'OUTBID',
          },
        })
      }

      // Create new bid
      const bid = await tx.bid.create({
        data: {
          amount,
          bidderId,
          prizeId,
          status: 'WINNING',
        },
      })

      // Update prize with new highest bid
      await tx.prize.update({
        where: { id: prizeId },
        data: {
          currentHighestBid: amount,
        },
      })

      return bid
    })

    // TODO: In production, broadcast outbid notification via Supabase Realtime

    return NextResponse.json({
      success: true,
      bid: result,
    })
  } catch (error) {
    console.error('Bid error:', error)
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prizeId = searchParams.get('prizeId')
    const bidderId = searchParams.get('bidderId')

    const where: Record<string, string> = {}
    if (prizeId) where.prizeId = prizeId
    if (bidderId) where.bidderId = bidderId

    const bids = await prisma.bid.findMany({
      where,
      include: {
        bidder: {
          select: {
            name: true,
            tableNumber: true,
          },
        },
        prize: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ bids })
  } catch (error) {
    console.error('Get bids error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}
