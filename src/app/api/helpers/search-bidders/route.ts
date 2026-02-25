import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const HELPER_COOKIE = 'helper_id'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const helperId = cookieStore.get(HELPER_COOKIE)?.value

    if (!helperId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Verify helper exists
    const helper = await prisma.helper.findUnique({
      where: { id: helperId, isActive: true },
    })

    if (!helper) {
      return NextResponse.json({ error: 'Helper not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const table = searchParams.get('table') || ''

    if (query.length < 2 && !table) {
      return NextResponse.json({ bidders: [] })
    }

    const where: Record<string, unknown> = {}

    if (query.length >= 2) {
      where.name = { contains: query, mode: 'insensitive' }
    }

    if (table) {
      where.tableNumber = table
    }

    const bidders = await prisma.bidder.findMany({
      where,
      select: {
        id: true,
        name: true,
        tableNumber: true,
        email: true,
        phone: true,
      },
      take: 8,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ bidders })
  } catch (error) {
    console.error('Search bidders error:', error)
    return NextResponse.json({ error: 'Failed to search bidders' }, { status: 500 })
  }
}
