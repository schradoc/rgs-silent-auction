import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Full data reset — wipes all auction data, keeps admin accounts
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Check for prizesOnly flag in request body
    let prizesOnly = false
    try {
      const body = await request.json()
      prizesOnly = body?.prizesOnly === true
    } catch {
      // No body or invalid JSON — default to full reset
    }

    if (prizesOnly) {
      // Delete only prize-related data, keep bidders and helpers
      const deletedNotifications = await prisma.notification.deleteMany()
      const deletedFavorites = await prisma.favorite.deleteMany()
      const deletedWinners = await prisma.winner.deleteMany()
      const deletedPaperBids = await prisma.paperBid.deleteMany()
      const deletedBids = await prisma.bid.deleteMany()
      const deletedImages = await prisma.prizeImage.deleteMany()
      const deletedPrizes = await prisma.prize.deleteMany()

      return NextResponse.json({
        success: true,
        deleted: {
          notifications: deletedNotifications.count,
          favorites: deletedFavorites.count,
          winners: deletedWinners.count,
          paperBids: deletedPaperBids.count,
          bids: deletedBids.count,
          prizeImages: deletedImages.count,
          prizes: deletedPrizes.count,
        },
      })
    }

    // Full reset — Delete in FK-safe order
    const deletedNotifications = await prisma.notification.deleteMany()
    const deletedFavorites = await prisma.favorite.deleteMany()
    const deletedWinners = await prisma.winner.deleteMany()
    const deletedPaperBids = await prisma.paperBid.deleteMany()
    const deletedBids = await prisma.bid.deleteMany()
    const deletedBidders = await prisma.bidder.deleteMany()
    const deletedImages = await prisma.prizeImage.deleteMany()
    const deletedPrizes = await prisma.prize.deleteMany()
    const deletedHelpers = await prisma.helper.deleteMany()

    // Reset auction settings to PRELAUNCH / closed
    await prisma.auctionSettings.upsert({
      where: { id: 'settings' },
      update: {
        auctionState: 'PRELAUNCH',
        isAuctionOpen: false,
        auctionEndTime: null,
      },
      create: {
        id: 'settings',
        auctionState: 'PRELAUNCH',
        isAuctionOpen: false,
      },
    })

    return NextResponse.json({
      success: true,
      deleted: {
        notifications: deletedNotifications.count,
        favorites: deletedFavorites.count,
        winners: deletedWinners.count,
        paperBids: deletedPaperBids.count,
        bids: deletedBids.count,
        bidders: deletedBidders.count,
        prizeImages: deletedImages.count,
        prizes: deletedPrizes.count,
        helpers: deletedHelpers.count,
      },
    })
  } catch (error) {
    console.error('Full reset error:', error)
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 })
  }
}
