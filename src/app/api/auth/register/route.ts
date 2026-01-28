import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode } from '@/lib/utils'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

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

    // Check if bidder already exists
    const existingBidder = await prisma.bidder.findUnique({
      where: { email },
    })

    if (existingBidder) {
      // If already verified, just log them in
      if (existingBidder.emailVerified) {
        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAMES.bidderId, existingBidder.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 hours
        })

        return NextResponse.json({
          success: true,
          bidder: existingBidder,
          message: 'Welcome back!',
        })
      }

      // If not verified, send new code
      const verificationCode = generateVerificationCode()
      await prisma.bidder.update({
        where: { id: existingBidder.id },
        data: {
          verificationCode,
          name,
          tableNumber,
        },
      })

      // In production, send email here
      console.log(`[MOCK EMAIL] Verification code for ${email}: ${verificationCode}`)

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: 'Verification code sent',
      })
    }

    // Create new bidder
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

    // Set cookie (unverified for now)
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.bidderId, bidder.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    // In production, send email here
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
      // For demo purposes, include the code
      _demoCode: verificationCode,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    )
  }
}
