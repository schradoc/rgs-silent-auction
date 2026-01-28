import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const HELPER_COOKIE = 'helper_id'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        { error: 'PIN must be 4 digits' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')

    const helper = await prisma.helper.findFirst({
      where: { pin, isActive: true },
    })

    if (!helper) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    // Set helper cookie
    const cookieStore = await cookies()
    cookieStore.set(HELPER_COOKIE, helper.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return NextResponse.json({
      success: true,
      helper: {
        id: helper.id,
        name: helper.name,
        avatarColor: helper.avatarColor,
      },
    })
  } catch (error) {
    console.error('Helper login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
