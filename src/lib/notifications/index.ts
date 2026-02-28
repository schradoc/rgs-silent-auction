import { Resend } from 'resend'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

// Initialize clients (will be null if env vars not set)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

const FROM_EMAIL = process.env.FROM_EMAIL || 'auction@rgsauction.com'
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER
const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rgsauction.com'

export type NotificationType = 'OUTBID' | 'WINNING' | 'AUCTION_CLOSING' | 'WON'
export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP'

interface NotificationPayload {
  bidderId: string
  type: NotificationType
  prizeId?: string
  prizeTitle?: string
  prizeSlug?: string
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

    // Build message
    const message = buildMessage(payload, bidder.name)

    // Build fallback chain: preferred channel first, then SMS, EMAIL, WHATSAPP
    // SMS is prioritized because WhatsApp requires approved templates we don't have yet
    const allChannels: NotificationChannel[] = [bidder.notificationPref, 'SMS', 'EMAIL', 'WHATSAPP']
    const channels = allChannels.filter((ch, i) => allChannels.indexOf(ch) === i) // deduplicate

    for (const channel of channels) {
      // Skip SMS/WhatsApp if Twilio isn't configured
      if ((channel === 'SMS' || channel === 'WHATSAPP') && !twilioClient) continue

      // Check opt-in for the channel
      if (channel === 'EMAIL' && !bidder.emailOptIn && channel !== bidder.notificationPref) continue
      if (channel === 'SMS' && !bidder.smsOptIn && channel !== bidder.notificationPref) continue
      if (channel === 'WHATSAPP' && !bidder.whatsappOptIn && channel !== bidder.notificationPref) continue

      let result: { success: boolean; error?: string } = { success: false }

      switch (channel) {
        case 'EMAIL':
          if (resend && bidder.email) {
            result = await sendNotificationEmail(bidder.email, message.subject, message.htmlBody || message.body)
          }
          break
        case 'SMS':
          if (twilioClient && bidder.phone && TWILIO_PHONE) {
            result = await sendSMS(bidder.phone, message.body)
          }
          break
        case 'WHATSAPP':
          if (twilioClient && bidder.phone && TWILIO_WHATSAPP) {
            result = await sendWhatsApp(bidder.phone, message.body)
          }
          break
      }

      // Log notification attempt
      await prisma.notification.create({
        data: {
          type: payload.type,
          channel,
          bidderId: payload.bidderId,
          prizeId: payload.prizeId,
          message: message.body,
          delivered: result.success,
          error: result.error,
        },
      })

      if (result.success) return true
    }

    // Final fallback: for transactional notifications (OUTBID, WON), always try email
    // regardless of opt-in, as long as bidder has an email address
    const isTransactional = payload.type === 'OUTBID' || payload.type === 'WON'
    if (isTransactional && resend && bidder.email) {
      const result = await sendNotificationEmail(bidder.email, message.subject, message.htmlBody || message.body)
      await prisma.notification.create({
        data: {
          type: payload.type,
          channel: 'EMAIL',
          bidderId: payload.bidderId,
          prizeId: payload.prizeId,
          message: message.body,
          delivered: result.success,
          error: result.error ? `[fallback] ${result.error}` : undefined,
        },
      })
      if (result.success) return true
    }

    console.warn(`All notification channels failed for bidder ${payload.bidderId}`)
    return false
  } catch (err) {
    console.error('Notification error:', err)
    return false
  }
}

function buildMessage(payload: NotificationPayload, bidderName: string): { subject: string; body: string; htmlBody?: string } {
  const { type, prizeTitle, prizeSlug, amount, currentHighestBid, minutesRemaining } = payload
  const prizeUrl = prizeSlug ? `${APP_URL}/prizes/${prizeSlug}` : `${APP_URL}/prizes`
  const bidUrl = prizeSlug ? `${APP_URL}/prizes/${prizeSlug}?bid=true` : `${APP_URL}/prizes`
  // Short URLs for SMS — keeps links under 40 chars so they don't break across lines
  const smsBidUrl = prizeSlug ? `${APP_URL}/b/${prizeSlug}` : `${APP_URL}/prizes`
  const smsPrizeUrl = prizeSlug ? `${APP_URL}/prizes/${prizeSlug}` : `${APP_URL}/prizes`

  switch (type) {
    case 'OUTBID': {
      const subject = `You've been outbid on ${prizeTitle}!`
      const body = `Hi ${bidderName}, you've been outbid on "${prizeTitle}"!\n\nNew highest bid: ${formatCurrency(currentHighestBid || 0)}\n\nBid again: ${smsBidUrl}`
      const htmlContent = `
        <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">Hi ${bidderName},</p>
        <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">Someone has outbid you on <strong>"${prizeTitle}"</strong>!</p>
        <div style="background: #fef3c7; border-left: 4px solid #c9a227; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">New highest bid</p>
          <p style="margin: 4px 0 0; color: #1e3a5f; font-size: 28px; font-weight: 700;">${formatCurrency(currentHighestBid || 0)}</p>
        </div>
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Don't let this one get away — place a higher bid now!</p>
      `
      return {
        subject,
        body,
        htmlBody: wrapEmailContent(htmlContent, bidUrl, 'Place a Higher Bid'),
      }
    }
    case 'WINNING':
      return {
        subject: `You're winning ${prizeTitle}!`,
        body: `Great news ${bidderName}! You're winning "${prizeTitle}" with a bid of ${formatCurrency(amount || 0)}.\n\nView: ${smsPrizeUrl}`,
        htmlBody: wrapEmailContent(`
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">Great news ${bidderName}!</p>
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">You're currently winning <strong>"${prizeTitle}"</strong> with a bid of <strong>${formatCurrency(amount || 0)}</strong>.</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Keep an eye on your bid — someone might outbid you!</p>
        `, prizeUrl, 'View Your Bid'),
      }
    case 'AUCTION_CLOSING':
      return {
        subject: `Auction closing in ${minutesRemaining} minutes!`,
        body: `${bidderName}, the auction is closing in ${minutesRemaining} minutes! Place your final bids: ${APP_URL}/prizes`,
        htmlBody: wrapEmailContent(`
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">${bidderName},</p>
          <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">The RGS-HK auction is closing in <strong>${minutesRemaining} minutes</strong>!</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Make sure you've placed your final bids.</p>
        `, `${APP_URL}/prizes`, 'View All Prizes'),
      }
    case 'WON': {
      const subject = `Congratulations! You won ${prizeTitle}!`
      const body = `Congratulations ${bidderName}! You won "${prizeTitle}" with a bid of ${formatCurrency(amount || 0)}. Our team will be in touch shortly. Thank you!\n\nView: ${APP_URL}/my-bids`
      const htmlContent = `
        <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">Congratulations ${bidderName}!</p>
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px;">
          <p style="margin: 0; color: #065f46; font-size: 14px;">You won</p>
          <p style="margin: 4px 0 0; color: #1e3a5f; font-size: 20px; font-weight: 700;">${prizeTitle}</p>
          <p style="margin: 4px 0 0; color: #065f46; font-size: 16px;">Winning bid: <strong>${formatCurrency(amount || 0)}</strong></p>
        </div>
        <p style="margin: 0 0 8px; color: #374151; font-size: 16px; line-height: 1.6;">A member of our team will be in touch shortly regarding collection.</p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Thank you for supporting the Royal Geographical Society Hong Kong!</p>
      `
      return {
        subject,
        body,
        htmlBody: wrapEmailContent(htmlContent, `${APP_URL}/my-bids`, 'View Your Wins'),
      }
    }
    default:
      return { subject: 'RGS-HK Auction Update', body: 'You have a new update from the RGS-HK auction.' }
  }
}

// Reusable email wrapper for consistent styling
function wrapEmailContent(content: string, buttonUrl?: string, buttonText?: string): string {
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
    // For notifications, use freeform body — this works within 24h of user-initiated contact
    // Outside 24h window, the fallback chain will route to email
    await twilioClient.messages.create({
      body,
      from: `whatsapp:${TWILIO_WHATSAPP}`,
      to: `whatsapp:${to}`,
    })
    return { success: true }
  } catch (err: unknown) {
    const errStr = String(err)
    console.error('WhatsApp send error:', err)
    // Error 63016 = outside 24h session window, let fallback chain handle it
    if (errStr.includes('63016')) {
      return { success: false, error: 'Outside WhatsApp session window — falling back to email' }
    }
    return { success: false, error: errStr }
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

    // Use sendNotification which routes by bidder preference (WhatsApp by default)
    await sendNotification({
      bidderId: bidderToNotify,
      type: 'OUTBID',
      prizeId,
      prizeTitle: prize.title,
      prizeSlug: prize.slug,
      currentHighestBid: newBidAmount,
    })
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

    // Use sendNotification which routes by bidder preference (WhatsApp by default)
    return await sendNotification({
      bidderId: bidder.id,
      type: 'WON',
      prizeId: prize.id,
      prizeTitle: prize.title,
      prizeSlug: prize.slug,
      amount: bid.amount,
    })
  } catch (err) {
    console.error('Error sending winner notification:', err)
    return false
  }
}
