import { NextRequest, NextResponse } from 'next/server'
import { generateVerificationCode, normalizeHKPhone, isValidPhone, normalizeTableNumber } from '@/lib/utils'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

const isDatabaseConfigured = !!process.env.DATABASE_URL

async function sendVerificationSMS(phone: string): Promise<boolean> {
  // Use Twilio Verify API for SMS OTP
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
    try {
      const twilio = await import('twilio')
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )

      await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: phone,
          channel: 'sms',
        })
      return true
    } catch (error) {
      console.error('Failed to send SMS verification:', error)
      return false
    }
  }

  return false
}

async function sendVerificationCode(phone: string | null, code: string): Promise<'sms' | 'console'> {
  // Send SMS verification via Twilio Verify
  if (phone) {
    const smsSent = await sendVerificationSMS(phone)
    if (smsSent) return 'sms'
  }

  // Dev fallback (no Twilio configured)
  console.log(`[DEV] Verification code for ${phone}: ${code}`)
  return 'console'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone: rawPhone, tableNumber, email } = body

    // Name, phone, and email are all required
    if (!name || !rawPhone || !email) {
      return NextResponse.json(
        { error: 'Name, phone number, and email are all required' },
        { status: 400 }
      )
    }

    // Normalize and validate phone if provided
    const phone = rawPhone ? normalizeHKPhone(rawPhone) : null

    if (rawPhone && (!phone || !isValidPhone(phone))) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    // Demo mode - create a mock bidder
    if (!isDatabaseConfigured) {
      const mockBidderId = `demo-${Date.now()}`
      const verificationCode = generateVerificationCode()

      const cookieStore = await cookies()
      cookieStore.set(COOKIE_NAMES.bidderId, mockBidderId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      })

      console.log(`[DEMO] Verification code for ${phone || email}: ${verificationCode}`)

      return NextResponse.json({
        success: true,
        bidder: {
          id: mockBidderId,
          name,
          phone: phone || null,
          email: email || null,
          tableNumber: tableNumber || null,
          phoneVerified: false,
        },
        requiresVerification: true,
        _demoCode: verificationCode,
        _demo: true,
      })
    }

    // Real database mode
    const { prisma } = await import('@/lib/prisma')

    // Look up by phone first (primary), then email
    let existingBidder = null
    if (phone) {
      existingBidder = await prisma.bidder.findUnique({
        where: { phone },
      })
    }
    if (!existingBidder && email) {
      existingBidder = await prisma.bidder.findUnique({
        where: { email },
      })
    }

    if (existingBidder) {
      if (existingBidder.emailVerified || existingBidder.phoneVerified) {
        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAMES.bidderId, existingBidder.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
        })

        return NextResponse.json({
          success: true,
          bidder: existingBidder,
          message: 'Welcome back!',
        })
      }

      const verificationCode = generateVerificationCode()
      await prisma.bidder.update({
        where: { id: existingBidder.id },
        data: {
          verificationCode,
          name,
          phone: phone || existingBidder.phone,
          email: email || existingBidder.email,
          tableNumber: tableNumber ? normalizeTableNumber(tableNumber) : existingBidder.tableNumber,
        },
      })

      const channel = await sendVerificationCode(phone, verificationCode)

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        verificationChannel: channel,
        message: channel === 'sms'
          ? 'Verification code sent via SMS'
          : 'Verification code generated (check console)',
      })
    }

    const verificationCode = generateVerificationCode()
    const bidder = await prisma.bidder.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        tableNumber: tableNumber ? normalizeTableNumber(tableNumber) : null,
        verificationCode,
        phoneVerified: false,
      },
    })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.bidderId, bidder.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    })

    const channel = await sendVerificationCode(phone, verificationCode)

    return NextResponse.json({
      success: true,
      bidder: {
        id: bidder.id,
        name: bidder.name,
        phone: bidder.phone,
        email: bidder.email,
        tableNumber: bidder.tableNumber,
        phoneVerified: bidder.phoneVerified,
      },
      requiresVerification: true,
      verificationChannel: channel,
      message: channel === 'sms'
        ? 'Verification code sent via SMS'
        : 'Verification code generated (check console)',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
