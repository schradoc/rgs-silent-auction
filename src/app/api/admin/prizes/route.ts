import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'


export const dynamic = 'force-dynamic'

// Get all prizes with details
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Get single prize
      const prize = await prisma.prize.findUnique({
        where: { id },
        include: {
          bids: {
            include: { bidder: true },
            orderBy: { amount: 'desc' },
          },
          _count: { select: { bids: true, favorites: true } },
        },
      })
      return NextResponse.json({ prize })
    }

    // Get all prizes
    const prizes = await prisma.prize.findMany({
      where: { parentPrizeId: null },
      include: {
        _count: { select: { bids: true, favorites: true } },
        variants: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
    })

    return NextResponse.json({ prizes })
  } catch (error) {
    console.error('Get prizes error:', error)
    return NextResponse.json({ error: 'Failed to get prizes' }, { status: 500 })
  }
}

// Create new prize
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const body = await request.json()

    const {
      title,
      shortDescription,
      fullDescription,
      donorName,
      minimumBid,
      category,
      validUntil,
      imageUrl,
      terms,
      multiWinnerEligible,
      multiWinnerSlots,
      displayOrder,
    } = body

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check for existing slug and make unique
    const existing = await prisma.prize.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true },
    })

    let slug = baseSlug
    if (existing.some((p) => p.slug === baseSlug)) {
      slug = `${baseSlug}-${existing.length + 1}`
    }

    const prize = await prisma.prize.create({
      data: {
        slug,
        title,
        shortDescription,
        fullDescription,
        donorName,
        minimumBid: parseInt(minimumBid),
        category,
        validUntil: new Date(validUntil),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop',
        terms,
        multiWinnerEligible: multiWinnerEligible || false,
        multiWinnerSlots: multiWinnerSlots ? parseInt(multiWinnerSlots) : null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, prize })
  } catch (error) {
    console.error('Create prize error:', error)
    return NextResponse.json({ error: 'Failed to create prize' }, { status: 500 })
  }
}

// Update prize
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Prize ID required' }, { status: 400 })
    }

    // Convert numeric fields
    const data: Record<string, unknown> = { ...updates }
    if (updates.minimumBid) data.minimumBid = parseInt(updates.minimumBid)
    if (updates.multiWinnerSlots) data.multiWinnerSlots = parseInt(updates.multiWinnerSlots)
    if (updates.displayOrder !== undefined) data.displayOrder = parseInt(updates.displayOrder)
    if (updates.validUntil) data.validUntil = new Date(updates.validUntil)

    const prize = await prisma.prize.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, prize })
  } catch (error) {
    console.error('Update prize error:', error)
    return NextResponse.json({ error: 'Failed to update prize' }, { status: 500 })
  }
}

// Delete prize (soft delete by deactivating)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const permanent = searchParams.get('permanent') === 'true'

    if (!id) {
      return NextResponse.json({ error: 'Prize ID required' }, { status: 400 })
    }

    // Check if prize has any bids
    const prize = await prisma.prize.findUnique({
      where: { id },
      include: { _count: { select: { bids: true } } },
    })

    if (!prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 })
    }

    if (permanent) {
      // Only allow permanent delete if no bids
      if (prize._count.bids > 0) {
        return NextResponse.json(
          { error: 'Cannot permanently delete prize with existing bids. Deactivate instead.' },
          { status: 400 }
        )
      }

      await prisma.prize.delete({ where: { id } })
      return NextResponse.json({ success: true, deleted: true })
    }

    // Soft delete (deactivate)
    await prisma.prize.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, deactivated: true })
  } catch (error) {
    console.error('Delete prize error:', error)
    return NextResponse.json({ error: 'Failed to delete prize' }, { status: 500 })
  }
}
