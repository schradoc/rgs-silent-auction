import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAMES.bidderId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
