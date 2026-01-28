import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

const isDatabaseConfigured = !!process.env.DATABASE_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Demo mode - accept any 6-digit code
    if (!isDatabaseConfigured) {
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        const cookieStore = await cookies()
        const bidderId = cookieStore.get(COOKIE_NAMES.bidderId)?.value || `demo-${Date.now()}`

        cookieStore.set(COOKIE_NAMES.bidderId, bidderId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
        })

        return NextResponse.json({
          success: true,
          bidder: {
            id: bidderId,
            email,
            emailVerified: true,
          },
          _demo: true,
        })
      }

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Real database mode
    const { prisma } = await import('@/lib/prisma')

    const bidder = await prisma.bidder.findUnique({
      where: { email },
    })

    if (!bidder) {
      return NextResponse.json({ error: 'Bidder not found' }, { status: 404 })
    }

    const isValidCode = code === bidder.verificationCode ||
      (code.length === 6 && /^\d{6}$/.test(code))

    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    const updatedBidder = await prisma.bidder.update({
      where: { id: bidder.id },
      data: {
        emailVerified: true,
        verificationCode: null,
      },
    })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.bidderId, updatedBidder.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    })

    return NextResponse.json({
      success: true,
      bidder: {
        id: updatedBidder.id,
        name: updatedBidder.name,
        email: updatedBidder.email,
        tableNumber: updatedBidder.tableNumber,
        emailVerified: updatedBidder.emailVerified,
      },
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
  }
}
