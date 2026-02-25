import { NextRequest, NextResponse } from 'next/server'
import { generateVerificationCode, normalizeHKPhone, isValidPhone, normalizeTableNumber } from '@/lib/utils'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

const isDatabaseConfigured = !!process.env.DATABASE_URL

async function sendVerificationEmail(email: string, name: string, code: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification code for ${email}: ${code}`)
    return false
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.FROM_EMAIL || 'auction@rgsauction.com'

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your RGS-HK Auction Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: #c9a227; font-size: 20px; font-weight: 700;">RGS-HK Silent Auction</h1>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 12px;">30th Anniversary Gala Dinner</p>
          </div>
          <div style="background: #fff; padding: 32px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
            <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">Hi ${name},</p>
            <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">Your verification code is:</p>
            <div style="text-align: center; margin: 0 0 24px;">
              <span style="display: inline-block; background: #f8fafc; border: 2px solid #c9a227; border-radius: 8px; padding: 16px 32px; font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #1e3a5f;">${code}</span>
            </div>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">This code expires in 15 minutes.</p>
          </div>
        </div>
      `,
      text: `Hi ${name}! Your RGS-HK Auction verification code is: ${code}. This code expires in 15 minutes.`,
    })
    return true
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return false
  }
}

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

async function sendVerificationCode(email: string | null, phone: string | null, name: string, code: string): Promise<'email' | 'sms' | 'console'> {
  // Try SMS first if phone provided (primary channel) — uses Twilio Verify
  if (phone) {
    const smsSent = await sendVerificationSMS(phone)
    if (smsSent) return 'sms'
  }

  // Fall back to email if provided — uses Resend with our own code
  if (email) {
    const emailSent = await sendVerificationEmail(email, name, code)
    if (emailSent) return 'email'
  }

  // Dev fallback
  console.log(`[DEV] Verification code for ${phone || email}: ${code}`)
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

      const channel = await sendVerificationCode(email || null, phone, name, verificationCode)

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        verificationChannel: channel,
        message: channel === 'sms'
          ? 'Verification code sent via SMS'
          : channel === 'email'
            ? 'Verification code sent to your email'
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

    const channel = await sendVerificationCode(email || null, phone, name, verificationCode)

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
        : channel === 'email'
          ? 'Verification code sent to your email'
          : 'Verification code generated (check console)',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
