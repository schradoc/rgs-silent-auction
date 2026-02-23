import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { normalizeHKPhone } from '@/lib/utils'

const isDatabaseConfigured = !!process.env.DATABASE_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone: rawPhone, code } = body

    const phone = rawPhone ? normalizeHKPhone(rawPhone) : null

    // Rate limit by phone to prevent brute-forcing verification codes
    if (phone) {
      const rl = checkRateLimit(`auth-verify:${phone}`, RATE_LIMITS.authVerify)
      if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)
    }

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
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
            phone,
            phoneVerified: true,
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
      where: { phone },
    })

    if (!bidder) {
      return NextResponse.json({ error: 'Bidder not found' }, { status: 404 })
    }

    // Reject if no verification code is set (already verified or never requested)
    if (!bidder.verificationCode) {
      return NextResponse.json(
        { error: 'No verification pending. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check 15-minute expiration based on when code was issued
    const codeAge = Date.now() - new Date(bidder.updatedAt).getTime()
    const FIFTEEN_MINUTES = 15 * 60 * 1000
    if (codeAge > FIFTEEN_MINUTES) {
      // Clear expired code
      await prisma.bidder.update({
        where: { id: bidder.id },
        data: { verificationCode: null },
      })
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Strict code comparison only - no fallback
    if (code !== bidder.verificationCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    const updatedBidder = await prisma.bidder.update({
      where: { id: bidder.id },
      data: {
        phoneVerified: true,
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
        phone: updatedBidder.phone,
        email: updatedBidder.email,
        tableNumber: updatedBidder.tableNumber,
        phoneVerified: updatedBidder.phoneVerified,
      },
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 })
  }
}
