import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value

    if (!bidderId) {
      return NextResponse.json({ bids: [] })
    }

    // Demo mode
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ bids: [], _demo: true })
    }

    const { prisma } = await import('@/lib/prisma')

    const bids = await prisma.bid.findMany({
      where: { bidderId },
      orderBy: { createdAt: 'desc' },
      include: {
        prize: {
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            currentHighestBid: true,
          },
        },
      },
    })

    return NextResponse.json({ bids })
  } catch (error) {
    console.error('My bids error:', error)
    return NextResponse.json({ bids: [], error: 'Failed to fetch bids' })
  }
}
