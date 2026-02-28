import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminSession()
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')

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
      take: 10,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ bidders })
  } catch (error) {
    console.error('Admin search bidders error:', error)
    return NextResponse.json({ error: 'Failed to search bidders' }, { status: 500 })
  }
}
