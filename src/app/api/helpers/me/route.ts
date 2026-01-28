import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const HELPER_COOKIE = 'helper_id'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const helperId = cookieStore.get(HELPER_COOKIE)?.value

    if (!helperId) {
      return NextResponse.json({ helper: null })
    }

    const { prisma } = await import('@/lib/prisma')

    const helper = await prisma.helper.findUnique({
      where: { id: helperId, isActive: true },
      select: {
        id: true,
        name: true,
        avatarColor: true,
      },
    })

    return NextResponse.json({ helper })
  } catch (error) {
    console.error('Helper me error:', error)
    return NextResponse.json({ helper: null })
  }
}
