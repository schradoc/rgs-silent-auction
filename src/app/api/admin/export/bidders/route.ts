import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get(COOKIE_NAMES.adminSession)?.value

    if (adminSession !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const bidders = await prisma.bidder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { bids: true } },
      },
    })

    const csv = [
      'Name,Email,Table Number,Email Verified,Total Bids,Registered At',
      ...bidders.map((bidder) =>
        [
          `"${bidder.name}"`,
          bidder.email,
          bidder.tableNumber,
          bidder.emailVerified ? 'Yes' : 'No',
          bidder._count.bids,
          new Date(bidder.createdAt).toISOString(),
        ].join(',')
      ),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="rgs-auction-bidders-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export bidders error:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
