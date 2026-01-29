import { Resend } from 'resend'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

// Initialize clients (will be null if env vars not set)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@rgs-auction.hk'
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER
const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER

export type NotificationType = 'OUTBID' | 'WINNING' | 'AUCTION_CLOSING' | 'WON'
export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP'

interface NotificationPayload {
  bidderId: string
  type: NotificationType
  prizeId?: string
  prizeTitle?: string
  amount?: number
  currentHighestBid?: number
  minutesRemaining?: number
}

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    // Get bidder
    const bidder = await prisma.bidder.findUnique({
      where: { id: payload.bidderId },
    })

    if (!bidder) {
      console.error('Bidder not found:', payload.bidderId)
      return false
    }

    // Determine channel based on preference
    const channel = bidder.notificationPref

    // Check opt-in
    if (channel === 'EMAIL' && !bidder.emailOptIn) return false
    if (channel === 'SMS' && !bidder.smsOptIn) return false
    if (channel === 'WHATSAPP' && !bidder.whatsappOptIn) return false

    // Build message
    const message = buildMessage(payload, bidder.name)

    // Send via appropriate channel
    let success = false
    let error: string | undefined

    switch (channel) {
      case 'EMAIL':
        if (resend && bidder.email) {
          const result = await sendNotificationEmail(bidder.email, message.subject, message.body)
          success = result.success
          error = result.error
        }
        break
      case 'SMS':
        if (twilioClient && bidder.phone && TWILIO_PHONE) {
          const result = await sendSMS(bidder.phone, message.body)
          success = result.success
          error = result.error
        }
        break
      case 'WHATSAPP':
        if (twilioClient && bidder.phone && TWILIO_WHATSAPP) {
          const result = await sendWhatsApp(bidder.phone, message.body)
          success = result.success
          error = result.error
        }
        break
    }

    // Log notification
    await prisma.notification.create({
      data: {
        type: payload.type,
        channel,
        bidderId: payload.bidderId,
        prizeId: payload.prizeId,
        message: message.body,
        delivered: success,
        error,
      },
    })

    return success
  } catch (err) {
    console.error('Notification error:', err)
    return false
  }
}

function buildMessage(payload: NotificationPayload, bidderName: string): { subject: string; body: string } {
  const { type, prizeTitle, amount, currentHighestBid, minutesRemaining } = payload

  switch (type) {
    case 'OUTBID':
      return {
        subject: `You've been outbid on ${prizeTitle}!`,
        body: `Hi ${bidderName}, someone has outbid you on "${prizeTitle}". The current highest bid is ${formatCurrency(currentHighestBid || 0)}. Visit rgs-auction.vercel.app to raise your bid!`,
      }
    case 'WINNING':
      return {
        subject: `You're winning ${prizeTitle}!`,
        body: `Great news ${bidderName}! You're currently winning "${prizeTitle}" with a bid of ${formatCurrency(amount || 0)}. Keep an eye on your bid!`,
      }
    case 'AUCTION_CLOSING':
      return {
        subject: `Auction closing in ${minutesRemaining} minutes!`,
        body: `${bidderName}, the RGS-HK auction is closing in ${minutesRemaining} minutes! Make sure you've placed your final bids at rgs-auction.vercel.app`,
      }
    case 'WON':
      return {
        subject: `Congratulations! You won ${prizeTitle}!`,
        body: `Congratulations ${bidderName}! You've won "${prizeTitle}" with a winning bid of ${formatCurrency(amount || 0)}. Thank you for supporting RGS-HK!`,
      }
    default:
      return { subject: 'RGS-HK Auction Update', body: 'You have a new update from the RGS-HK auction.' }
  }
}

// Reusable email wrapper for consistent styling
function wrapEmailContent(content: string, buttonUrl?: string, buttonText?: string): string {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rgs-auction.vercel.app'
  const finalButtonUrl = buttonUrl || `${APP_URL}/prizes`
  const finalButtonText = buttonText || 'View Auction'

  return `
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
                <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); padding: 32px 40px 24px;">
                  <h1 style="margin: 0; color: #c9a227; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                    RGS-HK Silent Auction
                  </h1>
                  <p style="margin: 6px 0 0; color: rgba(255,255,255,0.7); font-size: 13px;">
                    30th Anniversary Gala Dinner
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  ${content}

                  <div style="text-align: center; margin-top: 32px;">
                    <a href="${finalButtonUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(201, 162, 39, 0.3);">
                      ${finalButtonText}
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
  `
}

async function sendNotificationEmail(to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  if (!resend) return { success: false, error: 'Resend not configured' }

  const content = `
    <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.7;">
      ${body}
    </p>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text: body,
      html: wrapEmailContent(content),
    })
    return { success: true }
  } catch (err) {
    console.error('Email send error:', err)
    return { success: false, error: String(err) }
  }
}

async function sendSMS(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient || !TWILIO_PHONE) return { success: false, error: 'Twilio SMS not configured' }

  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_PHONE,
      to,
    })
    return { success: true }
  } catch (err) {
    console.error('SMS send error:', err)
    return { success: false, error: String(err) }
  }
}

async function sendWhatsApp(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient || !TWILIO_WHATSAPP) return { success: false, error: 'Twilio WhatsApp not configured' }

  try {
    await twilioClient.messages.create({
      body,
      from: `whatsapp:${TWILIO_WHATSAPP}`,
      to: `whatsapp:${to}`,
    })
    return { success: true }
  } catch (err) {
    console.error('WhatsApp send error:', err)
    return { success: false, error: String(err) }
  }
}

// Send outbid notification to the previous winning bidder
export async function notifyOutbidBidders(prizeId: string, newBidAmount: number, previousWinningBidderId?: string): Promise<void> {
  try {
    const prize = await prisma.prize.findUnique({
      where: { id: prizeId },
      select: { title: true, slug: true },
    })

    if (!prize) return

    // If we know the previous winner, notify just them
    // Otherwise, find the most recent outbid bid (the one just marked outbid)
    let bidderToNotify: string | undefined = previousWinningBidderId

    if (!bidderToNotify) {
      const lastOutbidBid = await prisma.bid.findFirst({
        where: {
          prizeId,
          status: 'OUTBID',
        },
        orderBy: { createdAt: 'desc' },
        select: { bidderId: true },
      })
      bidderToNotify = lastOutbidBid?.bidderId
    }

    if (!bidderToNotify) return

    const bidder = await prisma.bidder.findUnique({
      where: { id: bidderToNotify },
    })

    if (!bidder) return

    // Send via email (primary channel for outbid alerts)
    if (bidder.emailOptIn && bidder.email && resend) {
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rgs-auction.vercel.app'
      const prizeUrl = `${APP_URL}/prizes/${prize.slug}`

      const content = `
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 48px;">⚡</span>
        </div>

        <h2 style="margin: 0 0 16px; color: #1e3a5f; font-size: 22px; font-weight: 600; text-align: center;">
          You've Been Outbid!
        </h2>

        <p style="margin: 0 0 8px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
          Hi ${bidder.name},
        </p>
        <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
          Someone just placed a higher bid on <strong style="color: #1e3a5f;">"${prize.title}"</strong>
        </p>

        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
            New Highest Bid
          </p>
          <p style="margin: 0; color: #1e3a5f; font-size: 36px; font-weight: 700; letter-spacing: -1px;">
            ${formatCurrency(newBidAmount)}
          </p>
        </div>

        <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
          Act fast — don't let this prize slip away!
        </p>
      `

      await resend.emails.send({
        from: FROM_EMAIL,
        to: bidder.email,
        subject: `⚡ You've been outbid on ${prize.title}!`,
        html: wrapEmailContent(content, prizeUrl, 'Place a Higher Bid'),
      })

      // Log the notification
      await prisma.notification.create({
        data: {
          type: 'OUTBID',
          channel: 'EMAIL',
          bidderId: bidderToNotify,
          prizeId,
          message: `Outbid on ${prize.title} - new high bid ${formatCurrency(newBidAmount)}`,
          delivered: true,
        },
      })
    }
  } catch (err) {
    console.error('Error notifying outbid bidder:', err)
  }
}

// Send a generic email (for admin logins, etc.)
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] Resend not configured, logging email:')
    console.log(`To: ${params.to}`)
    console.log(`Subject: ${params.subject}`)
    return { success: false, error: 'Resend not configured' }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })
    return { success: true }
  } catch (err) {
    console.error('Email send error:', err)
    return { success: false, error: String(err) }
  }
}

// Send winner notification
export async function sendWinnerNotification(winnerId: string): Promise<boolean> {
  try {
    const winner = await prisma.winner.findUnique({
      where: { id: winnerId },
      include: {
        bid: true,
        bidder: true,
        prize: true,
      },
    })

    if (!winner) return false

    const { bidder, prize, bid } = winner
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rgs-auction.vercel.app'

    // Send email notification
    if (resend && bidder.email) {
      const content = `
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 56px;">🎉</span>
        </div>

        <h2 style="margin: 0 0 16px; color: #1e3a5f; font-size: 26px; font-weight: 700; text-align: center;">
          Congratulations, ${bidder.name}!
        </h2>

        <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
          You've won the auction!
        </p>

        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); border-radius: 12px; padding: 28px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; color: rgba(255,255,255,0.7); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
            Your Prize
          </p>
          <h3 style="margin: 0 0 16px; color: #ffffff; font-size: 20px; font-weight: 600;">
            ${prize.title}
          </h3>
          <div style="background: rgba(201, 162, 39, 0.2); border-radius: 8px; padding: 16px; display: inline-block;">
            <p style="margin: 0 0 4px; color: #c9a227; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              Winning Bid
            </p>
            <p style="margin: 0; color: #c9a227; font-size: 32px; font-weight: 700; letter-spacing: -1px;">
              ${formatCurrency(bid.amount)}
            </p>
          </div>
        </div>

        <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #166534; font-size: 14px; font-weight: 600;">
            What happens next?
          </p>
          <p style="margin: 0; color: #15803d; font-size: 14px; line-height: 1.6;">
            A member of our team will be in touch shortly to arrange collection and payment.
            Thank you for supporting the Royal Geographical Society Hong Kong!
          </p>
        </div>
      `

      await resend.emails.send({
        from: FROM_EMAIL,
        to: bidder.email,
        subject: `🎉 Congratulations! You won "${prize.title}"!`,
        html: wrapEmailContent(content, undefined, 'View My Wins'),
      })

      // Log the notification
      await prisma.notification.create({
        data: {
          type: 'WON',
          channel: 'EMAIL',
          bidderId: bidder.id,
          prizeId: prize.id,
          message: `Won ${prize.title} with bid of ${formatCurrency(bid.amount)}`,
          delivered: true,
        },
      })

      return true
    }

    return false
  } catch (err) {
    console.error('Error sending winner notification:', err)
    return false
  }
}
