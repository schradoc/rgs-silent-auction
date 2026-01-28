import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value

    if (!bidderId) {
      return NextResponse.json({ bidder: null })
    }

    const bidder = await prisma.bidder.findUnique({
      where: { id: bidderId },
      select: {
        id: true,
        name: true,
        email: true,
        tableNumber: true,
        emailVerified: true,
      },
    })

    if (!bidder) {
      // Clear invalid cookie
      cookieStore.delete(COOKIE_NAMES.bidderId)
      return NextResponse.json({ bidder: null })
    }

    return NextResponse.json({ bidder })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ bidder: null })
  }
}
