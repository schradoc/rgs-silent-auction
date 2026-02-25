import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { searchParams } = new URL(request.url)
    const prizeId = searchParams.get('prizeId')
    const category = searchParams.get('category')

    if (!prizeId || !category) {
      return NextResponse.json({ prizes: [] })
    }

    // Get similar active prizes in the same category, excluding the current one
    const similar = await prisma.prize.findMany({
      where: {
        isActive: true,
        parentPrizeId: null,
        category: category as any,
        id: { not: prizeId },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        category: true,
        minimumBid: true,
        currentHighestBid: true,
        imageUrl: true,
        donorName: true,
        lotNumber: true,
        subLotLetter: true,
        _count: { select: { bids: true } },
      },
      orderBy: { currentHighestBid: 'desc' },
      take: 4,
    })

    return NextResponse.json({ prizes: similar })
  } catch (error) {
    console.error('Similar prizes error:', error)
    return NextResponse.json({ prizes: [] })
  }
}
