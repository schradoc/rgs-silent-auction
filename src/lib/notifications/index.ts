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
          const result = await sendEmail(bidder.email, message.subject, message.body)
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

async function sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  if (!resend) return { success: false, error: 'Resend not configured' }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text: body,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e3a5f; padding: 20px; text-align: center;">
            <h1 style="color: #c9a227; margin: 0;">RGS-HK Auction</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">${body}</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="https://rgs-auction.vercel.app/prizes" style="background: #c9a227; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Auction</a>
            </div>
          </div>
          <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
            Royal Geographical Society - Hong Kong | 30th Anniversary Gala
          </div>
        </div>
      `,
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

      await resend.emails.send({
        from: FROM_EMAIL,
        to: bidder.email,
        subject: `You've been outbid on ${prize.title}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; padding: 20px; text-align: center;">
              <h1 style="color: #c9a227; margin: 0;">RGS-HK Auction</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <p style="font-size: 18px; line-height: 1.6; color: #333;">
                Hi ${bidder.name},
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Someone has outbid you on <strong>"${prize.title}"</strong>!
              </p>
              <div style="background: #fff; border: 2px solid #c9a227; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">Current Highest Bid</p>
                <p style="margin: 10px 0 0 0; color: #1e3a5f; font-size: 32px; font-weight: bold;">
                  ${formatCurrency(newBidAmount)}
                </p>
              </div>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${prizeUrl}" style="background: #c9a227; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Place a Higher Bid
                </a>
              </div>
              <p style="font-size: 14px; color: #666; text-align: center;">
                Don't let this prize slip away!
              </p>
            </div>
            <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
              Royal Geographical Society - Hong Kong | 30th Anniversary Gala
            </div>
          </div>
        `,
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
      await resend.emails.send({
        from: FROM_EMAIL,
        to: bidder.email,
        subject: `Congratulations! You won "${prize.title}"!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; padding: 20px; text-align: center;">
              <h1 style="color: #c9a227; margin: 0;">RGS-HK Auction</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎉</span>
              </div>
              <h2 style="text-align: center; color: #1e3a5f; margin-bottom: 20px;">
                Congratulations, ${bidder.name}!
              </h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333; text-align: center;">
                You've won the auction for:
              </p>
              <div style="background: #fff; border: 2px solid #c9a227; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #1e3a5f; font-size: 20px;">
                  ${prize.title}
                </h3>
                <p style="margin: 0; color: #666; font-size: 14px;">Winning Bid</p>
                <p style="margin: 5px 0 0 0; color: #c9a227; font-size: 28px; font-weight: bold;">
                  ${formatCurrency(bid.amount)}
                </p>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #333; text-align: center;">
                Thank you for supporting the Royal Geographical Society Hong Kong!
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #333; text-align: center;">
                A member of our team will be in touch shortly to arrange collection and payment.
              </p>
            </div>
            <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
              Royal Geographical Society - Hong Kong | 30th Anniversary Gala
            </div>
          </div>
        `,
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
