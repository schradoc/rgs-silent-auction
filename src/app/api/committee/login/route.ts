import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const COMMITTEE_PIN = '2026'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rateCheck = checkRateLimit(`committee-login:${ip}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })

    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterSeconds)
    }

    const { pin } = await request.json()

    if (!pin || pin !== COMMITTEE_PIN) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set('committee_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Committee login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
