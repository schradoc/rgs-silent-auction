import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')

    const prizes = await prisma.prize.findMany({
      where: { isActive: true, parentPrizeId: null },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        category: true,
        minimumBid: true,
        currentHighestBid: true,
        imageUrl: true,
      },
    })

    return NextResponse.json({ prizes })
  } catch (error) {
    console.error('Prizes fetch error:', error)
    return NextResponse.json({ prizes: [], error: 'Failed to fetch prizes' })
  }
}
