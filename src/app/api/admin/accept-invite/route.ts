import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// Verify invitation (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    const invitation = await prisma.adminInvitation.findUnique({
      where: { token },
      include: {
        invitedBy: {
          select: { name: true },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        invitedBy: invitation.invitedBy.name,
      },
    })
  } catch (error) {
    console.error('Verify invitation error:', error)
    return NextResponse.json({ error: 'Failed to verify invitation' }, { status: 500 })
  }
}

// Accept invitation (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name } = body

    if (!token || !name) {
      return NextResponse.json({ error: 'Token and name required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    const invitation = await prisma.adminInvitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { email: invitation.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Create the user
    const user = await prisma.adminUser.create({
      data: {
        email: invitation.email,
        name: name.trim(),
        role: invitation.role,
        invitedById: invitation.invitedById,
      },
    })

    // Mark invitation as accepted
    await prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    })

    // Create session and log them in
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

    await prisma.adminSession.create({
      data: {
        token: sessionToken,
        adminUserId: user.id,
        expiresAt,
      },
    })

    // Update last login
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Set cookies
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAMES.adminSession, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    cookieStore.set('admin_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}
