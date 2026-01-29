import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// Verify magic link token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Find the session
    const session = await prisma.adminSession.findUnique({
      where: { token },
    })

    if (!session) {
      return NextResponse.json({ error: 'Invalid login link' }, { status: 401 })
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.adminSession.delete({ where: { id: session.id } })
      return NextResponse.json({ error: 'Login link has expired' }, { status: 401 })
    }

    if (!session.adminUserId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Get the admin user
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: session.adminUserId },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    if (!adminUser.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 401 })
    }

    // Extend session expiry now that it's verified
    const newExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    })

    // Update last login
    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLoginAt: new Date() },
    })

    // Set cookies
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.adminSession, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
    })
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    })
  } catch (error) {
    console.error('Admin magic link verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
