import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    const adminPassword = process.env.ADMIN_PASSWORD || 'rgs-admin-2026'

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.adminSession, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
