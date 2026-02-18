import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')

    const settings = await prisma.auctionSettings.findUnique({
      where: { id: 'settings' },
    })

    // Get stats
    const [prizesCount, biddersCount, bidsCount, prizes] = await Promise.all([
      prisma.prize.count({ where: { isActive: true, parentPrizeId: null } }),
      prisma.bidder.count(),
      prisma.bid.count(),
      prisma.prize.findMany({
        where: { isActive: true, parentPrizeId: null },
        select: { currentHighestBid: true },
      }),
    ])

    const totalRaised = prizes.reduce((sum, p) => sum + p.currentHighestBid, 0)

    return NextResponse.json({
      isAuctionOpen: settings?.isAuctionOpen ?? false,
      auctionEndTime: settings?.auctionEndTime,
      // Add a start time field (for now, use a fixed time or could add to schema)
      auctionStartTime: process.env.AUCTION_START_TIME || '2026-02-28T18:00:00+08:00',
      stats: {
        totalPrizes: prizesCount,
        totalBidders: biddersCount,
        totalBids: bidsCount,
        totalRaised,
      },
    })
  } catch (error) {
    logger.error('Auction status check failed - failing closed', error)
    // Fail CLOSED on error - never allow bidding when we can't verify state
    return NextResponse.json({
      isAuctionOpen: false,
      auctionEndTime: null,
      auctionStartTime: null,
      stats: { totalPrizes: 0, totalBidders: 0, totalBids: 0, totalRaised: 0 },
      _error: true,
    }, { status: 503 })
  }
}
