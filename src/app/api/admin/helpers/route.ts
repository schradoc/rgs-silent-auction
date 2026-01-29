import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Avatar colors for helpers
const AVATAR_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F43F5E', // rose
  '#14B8A6', // teal
]

// GET - List all helpers
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const helpers = await prisma.helper.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            bidsPrompted: true,
            paperBids: true,
          },
        },
      },
    })

    return NextResponse.json({ helpers })
  } catch (error) {
    console.error('Admin helpers list error:', error)
    return NextResponse.json({ error: 'Failed to fetch helpers' }, { status: 500 })
  }
}

// POST - Create new helper
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, pin } = await request.json()

    if (!name || !pin) {
      return NextResponse.json(
        { error: 'Name and PIN are required' },
        { status: 400 }
      )
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')

    // Check if PIN already exists
    const existingHelper = await prisma.helper.findFirst({
      where: { pin },
    })

    if (existingHelper) {
      return NextResponse.json(
        { error: 'PIN already in use' },
        { status: 400 }
      )
    }

    // Get count of existing helpers to assign color
    const helperCount = await prisma.helper.count()
    const avatarColor = AVATAR_COLORS[helperCount % AVATAR_COLORS.length]

    const helper = await prisma.helper.create({
      data: {
        name,
        pin,
        avatarColor,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      helper: {
        id: helper.id,
        name: helper.name,
        avatarColor: helper.avatarColor,
        pin: helper.pin,
      },
    })
  } catch (error) {
    console.error('Admin create helper error:', error)
    return NextResponse.json({ error: 'Failed to create helper' }, { status: 500 })
  }
}

// PATCH - Update helper
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, pin, isActive } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Helper ID is required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // If changing PIN, check it's not already in use
    if (pin) {
      const existingHelper = await prisma.helper.findFirst({
        where: { pin, NOT: { id } },
      })

      if (existingHelper) {
        return NextResponse.json(
          { error: 'PIN already in use' },
          { status: 400 }
        )
      }
    }

    const helper = await prisma.helper.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(pin && { pin }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      success: true,
      helper,
    })
  } catch (error) {
    console.error('Admin update helper error:', error)
    return NextResponse.json({ error: 'Failed to update helper' }, { status: 500 })
  }
}

// DELETE - Remove helper
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Helper ID is required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Soft delete - just set isActive to false
    await prisma.helper.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete helper error:', error)
    return NextResponse.json({ error: 'Failed to delete helper' }, { status: 500 })
  }
}
