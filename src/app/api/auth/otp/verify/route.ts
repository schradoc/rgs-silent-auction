import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Find bidder with this phone and OTP
    const bidder = await prisma.bidder.findFirst({
      where: {
        phone,
        otpCode: otp,
        otpExpires: { gt: new Date() },
      },
    })

    if (!bidder) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
    }

    // Clear the OTP
    await prisma.bidder.update({
      where: { id: bidder.id },
      data: {
        otpCode: null,
        otpExpires: null,
      },
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.bidderId, bidder.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      success: true,
      bidder: {
        id: bidder.id,
        name: bidder.name,
        email: bidder.email,
        tableNumber: bidder.tableNumber,
      },
    })
  } catch (error) {
    console.error('OTP verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
