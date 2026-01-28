import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rgs-auction.vercel.app'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Find bidder by email
    const bidder = await prisma.bidder.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!bidder) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a magic link has been sent.',
      })
    }

    // Generate magic link token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Save token to bidder
    await prisma.bidder.update({
      where: { id: bidder.id },
      data: {
        magicLinkToken: token,
        magicLinkExpires: expires,
      },
    })

    // Send email with magic link
    const magicLink = `${APP_URL}/api/auth/magic-link/verify?token=${token}`

    // Try to send email via Resend
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@rgs-auction.hk',
        to: email,
        subject: 'Sign in to RGS-HK Auction',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; padding: 20px; text-align: center;">
              <h1 style="color: #c9a227; margin: 0;">RGS-HK Auction</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Hi ${bidder.name},
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Click the button below to sign in to your auction account. This link will expire in 15 minutes.
              </p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${magicLink}" style="background: #c9a227; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Sign In to Auction
                </a>
              </div>
              <p style="font-size: 14px; color: #666;">
                If you didn't request this link, you can safely ignore this email.
              </p>
            </div>
            <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
              Royal Geographical Society - Hong Kong | 30th Anniversary Gala
            </div>
          </div>
        `,
      })
    } else {
      // Log magic link for testing when email not configured
      console.log('Magic link (email not configured):', magicLink)
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a magic link has been sent.',
      // Include link in dev mode for testing
      ...(process.env.NODE_ENV === 'development' && { _devLink: magicLink }),
    })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 })
  }
}
