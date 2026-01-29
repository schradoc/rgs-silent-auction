import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

// Send magic link to admin email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Check if any admin users exist
    const userCount = await prisma.adminUser.count()

    if (userCount === 0) {
      // No users exist - this is first-time setup
      // Generate a setup token that allows creating the first account
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      // Store setup token in a temporary way
      await prisma.adminSession.create({
        data: {
          token,
          expiresAt,
          // No adminUserId - this is a setup session
        },
      })

      // For first-time setup, we just return needsSetup
      // The user will enter a password to create their account
      return NextResponse.json({
        needsSetup: true,
        message: 'No admin accounts exist. Please create the first owner account.',
      })
    }

    // Check if user exists
    const user = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !user.isActive) {
      // Don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a login link will be sent.',
      })
    }

    // Generate magic link token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store the token
    await prisma.adminSession.create({
      data: {
        token,
        expiresAt,
        adminUserId: user.id,
        // Mark as magic link session (not yet verified)
      },
    })

    // Send email with magic link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const magicLink = `${appUrl}/admin/verify?token=${token}`

    const { sendEmail } = await import('@/lib/notifications')
    await sendEmail({
      to: user.email,
      subject: 'RGS-HK Admin Login',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">Admin Login</h2>
          <p>Hi ${user.name},</p>
          <p>Click the button below to log in to the RGS-HK Silent Auction admin dashboard:</p>
          <div style="margin: 24px 0;">
            <a href="${magicLink}" style="background: #c9a227; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">
              Log In to Admin
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a login link will be sent.',
    })
  } catch (error) {
    console.error('Admin magic link error:', error)
    return NextResponse.json({ error: 'Failed to send login link' }, { status: 500 })
  }
}
