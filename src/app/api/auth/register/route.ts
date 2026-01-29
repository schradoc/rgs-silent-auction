import { NextRequest, NextResponse } from 'next/server'
import { generateVerificationCode } from '@/lib/utils'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

const isDatabaseConfigured = !!process.env.DATABASE_URL

async function sendVerificationEmail(email: string, name: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification code for ${email}: ${code}`)
    return false
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Your RGS-HK Auction Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e3a5f; padding: 20px; text-align: center;">
            <h1 style="color: #c9a227; margin: 0;">RGS-HK Auction</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Hi ${name},
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Your verification code is:
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <span style="background: #1e3a5f; color: #c9a227; padding: 16px 32px; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; display: inline-block;">
                ${code}
              </span>
            </div>
            <p style="font-size: 14px; color: #666;">
              Enter this code to complete your registration and start bidding.
            </p>
          </div>
          <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
            Royal Geographical Society - Hong Kong | 30th Anniversary Gala
          </div>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, tableNumber } = body

    if (!name || !email || !tableNumber) {
      return NextResponse.json(
        { error: 'Name, email, and table number are required' },
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

      console.log(`[DEMO] Verification code for ${email}: ${verificationCode}`)

      return NextResponse.json({
        success: true,
        bidder: {
          id: mockBidderId,
          name,
          email,
          tableNumber,
          emailVerified: false,
        },
        requiresVerification: true,
        _demoCode: verificationCode,
        _demo: true,
      })
    }

    // Real database mode
    const { prisma } = await import('@/lib/prisma')

    const existingBidder = await prisma.bidder.findUnique({
      where: { email },
    })

    if (existingBidder) {
      if (existingBidder.emailVerified) {
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
        data: { verificationCode, name, tableNumber },
      })

      await sendVerificationEmail(email, name, verificationCode)

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: 'Verification code sent to your email',
      })
    }

    const verificationCode = generateVerificationCode()
    const bidder = await prisma.bidder.create({
      data: {
        name,
        email,
        tableNumber,
        verificationCode,
        emailVerified: false,
      },
    })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.bidderId, bidder.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    })

    await sendVerificationEmail(email, name, verificationCode)

    return NextResponse.json({
      success: true,
      bidder: {
        id: bidder.id,
        name: bidder.name,
        email: bidder.email,
        tableNumber: bidder.tableNumber,
        emailVerified: bidder.emailVerified,
      },
      requiresVerification: true,
      message: 'Verification code sent to your email',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
