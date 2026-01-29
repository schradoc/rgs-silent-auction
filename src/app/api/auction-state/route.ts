import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma')

    const settings = await prisma.auctionSettings.findFirst()

    return NextResponse.json({
      state: settings?.auctionState || 'DRAFT',
      isOpen: settings?.isAuctionOpen ?? false,
      endTime: settings?.auctionEndTime,
    })
  } catch (error) {
    console.error('Failed to get auction state:', error)
    return NextResponse.json(
      { state: 'DRAFT', isOpen: false },
      { status: 500 }
    )
  }
}
