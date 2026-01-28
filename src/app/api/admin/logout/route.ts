import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAMES.adminSession)

  return NextResponse.redirect(new URL('/admin', request.url))
}
