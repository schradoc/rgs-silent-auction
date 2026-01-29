import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sendEmail } = await import('@/lib/notifications')

    // Get the current admin's email
    const adminEmail = auth.user?.email
    if (!adminEmail) {
      return NextResponse.json({ error: 'No admin email found' }, { status: 400 })
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rgs-auction.vercel.app'

    const result = await sendEmail({
      to: adminEmail,
      subject: 'RGS Auction - Test Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); padding: 40px 40px 30px;">
                      <h1 style="margin: 0; color: #c9a227; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        RGS-HK Silent Auction
                      </h1>
                      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                        30th Anniversary Gala Dinner
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 60px; height: 60px; background-color: #e8f5e9; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                          <span style="font-size: 28px;">✓</span>
                        </div>
                      </div>

                      <h2 style="margin: 0 0 16px; color: #1e3a5f; font-size: 24px; font-weight: 600; text-align: center;">
                        Email Configuration Working
                      </h2>

                      <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6; text-align: center;">
                        This test email confirms that your email delivery is configured correctly.
                        Winner notifications, outbid alerts, and admin invitations will be delivered successfully.
                      </p>

                      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
                          Email Provider
                        </p>
                        <p style="margin: 0; color: #1e3a5f; font-size: 18px; font-weight: 600;">
                          Resend
                        </p>
                      </div>

                      <div style="text-align: center; margin-top: 32px;">
                        <a href="${APP_URL}/admin/dashboard"
                           style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(201, 162, 39, 0.3);">
                          Go to Dashboard
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
                        Royal Geographical Society - Hong Kong<br>
                        28 February 2026 • Hong Kong Club
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (result.success) {
      return NextResponse.json({ success: true, message: `Test email sent to ${adminEmail}` })
    } else {
      return NextResponse.json({ error: result.error || 'Failed to send test email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}
