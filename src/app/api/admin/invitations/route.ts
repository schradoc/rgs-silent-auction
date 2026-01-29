import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// Get pending invitations
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get(COOKIE_NAMES.adminSession)?.value === 'true'
    const token = cookieStore.get('admin_token')?.value

    if (!isAdmin || !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Get current user
    const session = await prisma.adminSession.findUnique({
      where: { token },
    })

    if (!session?.adminUserId) {
      return NextResponse.json({ error: 'Session invalid' }, { status: 401 })
    }

    const currentUser = await prisma.adminUser.findUnique({
      where: { id: session.adminUserId },
    })

    if (!currentUser || currentUser.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get pending invitations
    const invitations = await prisma.adminInvitation.findMany({
      where: {
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Get invitations error:', error)
    return NextResponse.json({ error: 'Failed to get invitations' }, { status: 500 })
  }
}

// Create invitation
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get(COOKIE_NAMES.adminSession)?.value === 'true'
    const token = cookieStore.get('admin_token')?.value

    if (!isAdmin || !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Get current user
    const session = await prisma.adminSession.findUnique({
      where: { token },
    })

    if (!session?.adminUserId) {
      return NextResponse.json({ error: 'Session invalid' }, { status: 401 })
    }

    const currentUser = await prisma.adminUser.findUnique({
      where: { id: session.adminUserId },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { email, role } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Check permissions for role assignment
    // OWNER can invite anyone
    // ADMIN can only invite EMPLOYEE
    if (currentUser.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Employees cannot invite users' }, { status: 403 })
    }

    if (currentUser.role === 'ADMIN' && role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Admins can only invite employees' }, { status: 403 })
    }

    // Check if email already exists
    const existingUser = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already pending for this email' }, { status: 400 })
    }

    // Create invitation
    const inviteToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await prisma.adminInvitation.create({
      data: {
        email: email.toLowerCase(),
        role: role || 'EMPLOYEE',
        token: inviteToken,
        expiresAt,
        invitedById: currentUser.id,
      },
    })

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${appUrl}/admin/accept-invite?token=${inviteToken}`

    const { sendEmail } = await import('@/lib/notifications')
    await sendEmail({
      to: email,
      subject: 'You\'ve been invited to RGS-HK Admin',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">Admin Invitation</h2>
          <p>Hi,</p>
          <p>${currentUser.name} has invited you to join the RGS-HK Silent Auction admin team as ${role === 'ADMIN' ? 'an Admin' : 'an Employee'}.</p>
          <div style="margin: 24px 0;">
            <a href="${inviteLink}" style="background: #c9a227; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error) {
    console.error('Create invitation error:', error)
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }
}

// Revoke invitation
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get(COOKIE_NAMES.adminSession)?.value === 'true'
    const token = cookieStore.get('admin_token')?.value

    if (!isAdmin || !token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Get current user
    const session = await prisma.adminSession.findUnique({
      where: { token },
    })

    if (!session?.adminUserId) {
      return NextResponse.json({ error: 'Session invalid' }, { status: 401 })
    }

    const currentUser = await prisma.adminUser.findUnique({
      where: { id: session.adminUserId },
    })

    if (!currentUser || currentUser.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    await prisma.adminInvitation.delete({
      where: { id: invitationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete invitation error:', error)
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
  }
}
