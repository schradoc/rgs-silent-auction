import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isAuctionOpen, auctionEndTime } = await request.json()
    const { prisma } = await import('@/lib/prisma')

    const settings = await prisma.auctionSettings.upsert({
      where: { id: 'settings' },
      update: {
        ...(isAuctionOpen !== undefined && { isAuctionOpen }),
        ...(auctionEndTime !== undefined && { auctionEndTime: new Date(auctionEndTime) }),
      },
      create: {
        id: 'settings',
        isAuctionOpen: isAuctionOpen ?? true,
        auctionEndTime: auctionEndTime ? new Date(auctionEndTime) : null,
      },
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
