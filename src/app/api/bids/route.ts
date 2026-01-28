import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'
import { getMinimumNextBid } from '@/lib/utils'
import { mockPrizes } from '@/lib/mock-data'

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

    // Real database mode
    const { prisma } = await import('@/lib/prisma')

    const prize = await prisma.prize.findUnique({
      where: { id: prizeId },
    })

    if (!prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
    }

    if (!prize.isActive) {
      return NextResponse.json(
        { error: 'This prize is no longer available for bidding' },
        { status: 400 }
      )
    }

    const settings = await prisma.auctionSettings.findUnique({
      where: { id: 'settings' },
    })

    if (settings && !settings.isAuctionOpen) {
      return NextResponse.json(
        { error: 'The auction is currently closed' },
        { status: 400 }
      )
    }

    const minimumBid = getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)
    if (amount < minimumBid) {
      return NextResponse.json(
        { error: `Minimum bid is HK$${minimumBid.toLocaleString()}` },
        { status: 400 }
      )
    }

    const bidder = await prisma.bidder.findUnique({
      where: { id: bidderId },
    })

    if (!bidder) {
      return NextResponse.json(
        { error: 'Bidder not found. Please register again.' },
        { status: 404 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      if (prize.currentHighestBid > 0) {
        await tx.bid.updateMany({
          where: { prizeId, status: 'WINNING' },
          data: { status: 'OUTBID' },
        })
      }

      const bid = await tx.bid.create({
        data: {
          amount,
          bidderId,
          prizeId,
          status: 'WINNING',
        },
      })

      await tx.prize.update({
        where: { id: prizeId },
        data: { currentHighestBid: amount },
      })

      return bid
    })

    return NextResponse.json({ success: true, bid: result })
  } catch (error) {
    console.error('Bid error:', error)
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
    console.error('Get bids error:', error)
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
  }
}
