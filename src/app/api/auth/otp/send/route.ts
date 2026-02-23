import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { phone, channel = 'WHATSAPP' } = await request.json()

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

    // Use Twilio Verify API (handles WhatsApp templates automatically)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
      const twilio = await import('twilio')
      const client = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )

      // Use SMS for OTP delivery (WhatsApp templates not yet approved)
      const verifyChannel = 'sms'

      await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: phone,
          channel: verifyChannel,
        })
    } else {
      // Dev fallback: generate and store OTP manually
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expires = new Date(Date.now() + 10 * 60 * 1000)

      await prisma.bidder.update({
        where: { id: bidder.id },
        data: { otpCode: otp, otpExpires: expires },
      })

      console.log('OTP (Twilio not configured):', otp, 'for phone:', phone)

      return NextResponse.json({
        success: true,
        message: 'If an account exists with this phone number, an OTP has been sent.',
        ...(process.env.NODE_ENV === 'development' && { _devOtp: otp }),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this phone number, an OTP has been sent.',
    })
  } catch (error) {
    console.error('OTP send error:', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
