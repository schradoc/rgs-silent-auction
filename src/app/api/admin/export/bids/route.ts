import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get(COOKIE_NAMES.adminSession)?.value

    if (adminSession !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const bids = await prisma.bid.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        bidder: { select: { name: true, email: true, tableNumber: true } },
        prize: { select: { title: true } },
      },
    })

    const csv = [
      'Prize,Bidder Name,Bidder Email,Table,Amount,Status,Time',
      ...bids.map((bid) =>
        [
          `"${bid.prize.title}"`,
          `"${bid.bidder.name}"`,
          bid.bidder.email,
          bid.bidder.tableNumber,
          bid.amount,
          bid.status,
          new Date(bid.createdAt).toISOString(),
        ].join(',')
      ),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="rgs-auction-bids-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export bids error:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
