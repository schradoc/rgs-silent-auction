import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

const isDatabaseConfigured = !!process.env.DATABASE_URL

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value

    if (!bidderId) {
      return NextResponse.json({ bidder: null })
    }

    // Demo mode - return a mock bidder
    if (!isDatabaseConfigured) {
      if (bidderId.startsWith('demo-')) {
        return NextResponse.json({
          bidder: {
            id: bidderId,
            name: 'Demo User',
            email: 'demo@example.com',
            tableNumber: '1',
            emailVerified: true,
          },
          _demo: true,
        })
      }
      return NextResponse.json({ bidder: null })
    }

    // Real database mode
    const { prisma } = await import('@/lib/prisma')

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
      cookieStore.delete(COOKIE_NAMES.bidderId)
      return NextResponse.json({ bidder: null })
    }

    return NextResponse.json({ bidder })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ bidder: null })
  }
}
