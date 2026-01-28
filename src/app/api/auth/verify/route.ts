import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

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

    const bidder = await prisma.bidder.findUnique({
      where: { email },
    })

    if (!bidder) {
      return NextResponse.json(
        { error: 'Bidder not found' },
        { status: 404 }
      )
    }

    // For demo mode, accept any 6-digit code or the actual code
    const isValidCode = code === bidder.verificationCode ||
      (code.length === 6 && /^\d{6}$/.test(code))

    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Mark as verified and clear code
    const updatedBidder = await prisma.bidder.update({
      where: { id: bidder.id },
      data: {
        emailVerified: true,
        verificationCode: null,
      },
    })

    // Update cookie with verified session
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.bidderId, updatedBidder.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
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
    return NextResponse.json(
      { error: 'Failed to verify' },
      { status: 500 }
    )
  }
}
