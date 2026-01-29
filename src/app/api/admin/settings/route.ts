import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Get settings (auction + display)
export async function GET() {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const [auctionSettings, displaySettings] = await Promise.all([
      prisma.auctionSettings.findUnique({ where: { id: 'settings' } }),
      prisma.displaySettings.findUnique({ where: { id: 'display' } }),
    ])

    return NextResponse.json({
      auctionSettings: auctionSettings || {
        id: 'settings',
        auctionState: 'DRAFT',
        isAuctionOpen: false,
        auctionEndTime: null,
      },
      displaySettings: displaySettings || {
        id: 'display',
        showDonorNames: true,
        showBidderNames: false,
        featuredRotationSecs: 8,
        customQrUrl: null,
      },
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prisma } = await import('@/lib/prisma')

    // Handle auction settings
    if (body.isAuctionOpen !== undefined || body.auctionEndTime !== undefined) {
      const settings = await prisma.auctionSettings.upsert({
        where: { id: 'settings' },
        update: {
          ...(body.isAuctionOpen !== undefined && { isAuctionOpen: body.isAuctionOpen }),
          ...(body.auctionEndTime !== undefined && { auctionEndTime: new Date(body.auctionEndTime) }),
        },
        create: {
          id: 'settings',
          isAuctionOpen: body.isAuctionOpen ?? true,
          auctionEndTime: body.auctionEndTime ? new Date(body.auctionEndTime) : null,
        },
      })
      return NextResponse.json({ success: true, settings })
    }

    // Handle display settings
    if (
      body.showDonorNames !== undefined ||
      body.showBidderNames !== undefined ||
      body.featuredRotationSecs !== undefined ||
      body.customQrUrl !== undefined
    ) {
      const displaySettings = await prisma.displaySettings.upsert({
        where: { id: 'display' },
        update: {
          ...(body.showDonorNames !== undefined && { showDonorNames: body.showDonorNames }),
          ...(body.showBidderNames !== undefined && { showBidderNames: body.showBidderNames }),
          ...(body.featuredRotationSecs !== undefined && { featuredRotationSecs: body.featuredRotationSecs }),
          ...(body.customQrUrl !== undefined && { customQrUrl: body.customQrUrl || null }),
        },
        create: {
          id: 'display',
          showDonorNames: body.showDonorNames ?? true,
          showBidderNames: body.showBidderNames ?? false,
          featuredRotationSecs: body.featuredRotationSecs ?? 8,
          customQrUrl: body.customQrUrl || null,
        },
      })
      return NextResponse.json({ success: true, displaySettings })
    }

    return NextResponse.json({ error: 'No settings to update' }, { status: 400 })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
