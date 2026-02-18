import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import twilio from 'twilio'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phone, channel } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Check Twilio configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER
    const twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER

    if (!accountSid || !authToken) {
      return NextResponse.json({
        error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.'
      }, { status: 400 })
    }

    const client = twilio(accountSid, authToken)

    if (channel === 'whatsapp') {
      if (!twilioWhatsApp) {
        return NextResponse.json({
          error: 'WhatsApp not configured. Please set TWILIO_WHATSAPP_NUMBER environment variable.'
        }, { status: 400 })
      }

      await client.messages.create({
        body: '✅ RGS Auction - WhatsApp notifications are configured correctly! You will receive outbid alerts and winner notifications here.',
        from: `whatsapp:${twilioWhatsApp}`,
        to: `whatsapp:${phone}`,
      })

      return NextResponse.json({ success: true, message: `Test WhatsApp sent to ${phone}` })
    } else {
      if (!twilioPhone) {
        return NextResponse.json({
          error: 'SMS not configured. Please set TWILIO_PHONE_NUMBER environment variable.'
        }, { status: 400 })
      }

      await client.messages.create({
        body: 'RGS Auction - SMS notifications are configured correctly! You will receive outbid alerts and winner notifications here.',
        from: twilioPhone,
        to: phone,
      })

      return NextResponse.json({ success: true, message: `Test SMS sent to ${phone}` })
    }
  } catch (error) {
    console.error('Test SMS/WhatsApp error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send test message'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET endpoint to check configuration status
export async function GET() {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = {
      sms: {
        configured: Boolean(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_PHONE_NUMBER
        ),
        phone: process.env.TWILIO_PHONE_NUMBER ?
          `${process.env.TWILIO_PHONE_NUMBER.slice(0, 4)}...${process.env.TWILIO_PHONE_NUMBER.slice(-4)}` :
          null,
      },
      whatsapp: {
        configured: Boolean(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_WHATSAPP_NUMBER
        ),
        phone: process.env.TWILIO_WHATSAPP_NUMBER ?
          `${process.env.TWILIO_WHATSAPP_NUMBER.slice(0, 4)}...${process.env.TWILIO_WHATSAPP_NUMBER.slice(-4)}` :
          null,
      },
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Get SMS/WhatsApp status error:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
