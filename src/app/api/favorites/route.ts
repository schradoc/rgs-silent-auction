import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// GET - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value

    if (!bidderId) {
      return NextResponse.json({ favorites: [] })
    }

    const { prisma } = await import('@/lib/prisma')

    const favorites = await prisma.favorite.findMany({
      where: { bidderId },
      include: {
        prize: {
          select: {
            id: true,
            slug: true,
            title: true,
            shortDescription: true,
            imageUrl: true,
            minimumBid: true,
            currentHighestBid: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        id: f.id,
        prizeId: f.prizeId,
        createdAt: f.createdAt,
        prize: f.prize,
      })),
    })
  } catch (error) {
    console.error('Favorites fetch error:', error)
    return NextResponse.json({ favorites: [], error: 'Failed to fetch favorites' })
  }
}

// POST - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value

    if (!bidderId) {
      return NextResponse.json({ error: 'Please register to save favorites' }, { status: 401 })
    }

    const { prizeId } = await request.json()

    if (!prizeId) {
      return NextResponse.json({ error: 'Prize ID is required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        bidderId_prizeId: { bidderId, prizeId },
      },
    })

    if (existing) {
      return NextResponse.json({ success: true, favorite: existing, message: 'Already in favorites' })
    }

    const favorite = await prisma.favorite.create({
      data: { bidderId, prizeId },
    })

    return NextResponse.json({ success: true, favorite })
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

// DELETE - Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value

    if (!bidderId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const prizeId = searchParams.get('prizeId')

    if (!prizeId) {
      return NextResponse.json({ error: 'Prize ID is required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    await prisma.favorite.deleteMany({
      where: { bidderId, prizeId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove favorite error:', error)
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
  }
}
