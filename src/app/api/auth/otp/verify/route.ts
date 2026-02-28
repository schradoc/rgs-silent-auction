import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'
import { normalizeHKPhone } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { phone: rawPhone, otp } = await request.json()

    // Normalize phone number to match registration format
    const phone = rawPhone ? normalizeHKPhone(rawPhone) : null

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Verify via Twilio Verify API
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
      const twilio = await import('twilio')
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )

      const check = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: phone,
          code: otp,
        })

      if (check.status !== 'approved') {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
      }
    } else {
      // Dev fallback: check OTP stored in database
      const bidderCheck = await prisma.bidder.findFirst({
        where: {
          phone,
          otpCode: otp,
          otpExpires: { gt: new Date() },
        },
      })

      if (!bidderCheck) {
        return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 })
      }
    }

    // Find bidder and mark as verified
    const bidder = await prisma.bidder.findFirst({ where: { phone } })

    if (!bidder) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    await prisma.bidder.update({
      where: { id: bidder.id },
      data: {
        otpCode: null,
        otpExpires: null,
        phoneVerified: true,
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
        phone: bidder.phone,
        email: bidder.email,
        tableNumber: bidder.tableNumber,
      },
    })
  } catch (error) {
    console.error('OTP verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
