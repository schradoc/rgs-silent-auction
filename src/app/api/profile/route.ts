import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// GET - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value

    if (!bidderId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const bidder = await prisma.bidder.findUnique({
      where: { id: bidderId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        tableNumber: true,
        emailVerified: true,
        emailOptIn: true,
        smsOptIn: true,
        whatsappOptIn: true,
        notificationPref: true,
        createdAt: true,
        _count: {
          select: {
            bids: true,
            favorites: true,
          },
        },
      },
    })

    if (!bidder) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ profile: bidder })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PATCH - Update profile
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value

    if (!bidderId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      tableNumber,
      phone,
      emailOptIn,
      smsOptIn,
      whatsappOptIn,
      notificationPref,
    } = body

    const { prisma } = await import('@/lib/prisma')

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (tableNumber !== undefined) updateData.tableNumber = tableNumber
    if (phone !== undefined) updateData.phone = phone
    if (emailOptIn !== undefined) updateData.emailOptIn = emailOptIn
    if (smsOptIn !== undefined) updateData.smsOptIn = smsOptIn
    if (whatsappOptIn !== undefined) updateData.whatsappOptIn = whatsappOptIn
    if (notificationPref !== undefined) updateData.notificationPref = notificationPref

    const bidder = await prisma.bidder.update({
      where: { id: bidderId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        tableNumber: true,
        emailOptIn: true,
        smsOptIn: true,
        whatsappOptIn: true,
        notificationPref: true,
      },
    })

    return NextResponse.json({ success: true, profile: bidder })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
