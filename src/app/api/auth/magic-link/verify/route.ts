import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    const { prisma } = await import('@/lib/prisma')

    // Find bidder with this token
    const bidder = await prisma.bidder.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpires: { gt: new Date() },
      },
    })

    if (!bidder) {
      return NextResponse.redirect(new URL('/login?error=expired_token', request.url))
    }

    // Clear the magic link token
    await prisma.bidder.update({
      where: { id: bidder.id },
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
        emailVerified: true,
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

    // Redirect to prizes page
    return NextResponse.redirect(new URL('/prizes?login=success', request.url))
  } catch (error) {
    console.error('Magic link verify error:', error)
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
  }
}
