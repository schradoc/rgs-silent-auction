import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Single prize lookup by ID
    if (id) {
      const prize = await prisma.prize.findUnique({
        where: { id },
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          category: true,
          minimumBid: true,
          currentHighestBid: true,
          imageUrl: true,
          lotNumber: true,
          subLotLetter: true,
          donorName: true,
          donorUrl: true,
          location: true,
        },
      })

      if (!prize) {
        return NextResponse.json({ prize: null, error: 'Prize not found' }, { status: 404 })
      }

      return NextResponse.json({ prize })
    }

    // List all active top-level prizes
    const prizes = await prisma.prize.findMany({
      where: { isActive: true, parentPrizeId: null },
      orderBy: [{ lotNumber: { sort: 'asc', nulls: 'last' } }, { displayOrder: 'asc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        category: true,
        minimumBid: true,
        currentHighestBid: true,
        imageUrl: true,
        lotNumber: true,
        subLotLetter: true,
        donorName: true,
        donorUrl: true,
        location: true,
      },
    })

    return NextResponse.json({ prizes })
  } catch (error) {
    console.error('Prizes fetch error:', error)
    return NextResponse.json({ prizes: [], error: 'Failed to fetch prizes' })
  }
}
