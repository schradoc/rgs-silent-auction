import { NextRequest, NextResponse } from 'next/server'
import { generateVerificationCode } from '@/lib/utils'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

const isDatabaseConfigured = !!process.env.DATABASE_URL

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

      console.log(`[MOCK EMAIL] Verification code for ${email}: ${verificationCode}`)

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: 'Verification code sent',
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

    console.log(`[MOCK EMAIL] Verification code for ${email}: ${verificationCode}`)

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
      _demoCode: verificationCode,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
