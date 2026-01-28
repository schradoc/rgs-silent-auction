import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { phone, channel = 'SMS' } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Find bidder by phone
    const bidder = await prisma.bidder.findFirst({
      where: { phone },
    })

    if (!bidder) {
      // Don't reveal if phone exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this phone number, an OTP has been sent.',
      })
    }

    // Generate OTP
    const otp = generateOTP()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save OTP to bidder
    await prisma.bidder.update({
      where: { id: bidder.id },
      data: {
        otpCode: otp,
        otpExpires: expires,
      },
    })

    // Send OTP via Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = await import('twilio')
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )

      const message = `Your RGS-HK Auction verification code is: ${otp}. This code expires in 10 minutes.`

      if (channel === 'WHATSAPP' && process.env.TWILIO_WHATSAPP_NUMBER) {
        await client.messages.create({
          body: message,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${phone}`,
        })
      } else if (process.env.TWILIO_PHONE_NUMBER) {
        await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        })
      }
    } else {
      // Log OTP for testing when Twilio not configured
      console.log('OTP (Twilio not configured):', otp, 'for phone:', phone)
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this phone number, an OTP has been sent.',
      // Include OTP in dev mode for testing
      ...(process.env.NODE_ENV === 'development' && { _devOtp: otp }),
    })
  } catch (error) {
    console.error('OTP send error:', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
