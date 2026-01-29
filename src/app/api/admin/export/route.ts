import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { formatCurrency } from '@/lib/utils'


export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminSession()
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'winners' | 'bids' | 'bidders' | 'summary'

    switch (type) {
      case 'winners': {
        const winners = await prisma.winner.findMany({
          include: {
            bid: true,
            bidder: true,
            prize: true,
          },
          orderBy: { acceptedAt: 'asc' },
        })

        const csv = [
          ['Prize', 'Winner Name', 'Table', 'Email', 'Winning Bid', 'Confirmed At'].join(','),
          ...winners.map((w) =>
            [
              `"${w.prize.title.replace(/"/g, '""')}"`,
              `"${w.bidder.name.replace(/"/g, '""')}"`,
              w.bidder.tableNumber,
              w.bidder.email,
              w.bid.amount,
              new Date(w.acceptedAt).toISOString(),
            ].join(',')
          ),
        ].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="winners-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      case 'bids': {
        const bids = await prisma.bid.findMany({
          include: {
            bidder: true,
            prize: true,
          },
          orderBy: { createdAt: 'desc' },
        })

        const csv = [
          ['Prize', 'Bidder Name', 'Table', 'Amount', 'Status', 'Time'].join(','),
          ...bids.map((b) =>
            [
              `"${b.prize.title.replace(/"/g, '""')}"`,
              `"${b.bidder.name.replace(/"/g, '""')}"`,
              b.bidder.tableNumber,
              b.amount,
              b.status,
              new Date(b.createdAt).toISOString(),
            ].join(',')
          ),
        ].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="bids-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      case 'bidders': {
        const bidders = await prisma.bidder.findMany({
          include: {
            bids: {
              select: { id: true },
            },
            winners: {
              select: { id: true },
            },
          },
          orderBy: { tableNumber: 'asc' },
        })

        const csv = [
          ['Name', 'Email', 'Table', 'Phone', 'Total Bids', 'Wins', 'Registered At'].join(','),
          ...bidders.map((b) =>
            [
              `"${b.name.replace(/"/g, '""')}"`,
              b.email,
              b.tableNumber,
              b.phone || '',
              b.bids.length,
              b.winners.length,
              new Date(b.createdAt).toISOString(),
            ].join(',')
          ),
        ].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="bidders-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      case 'summary': {
        const [prizes, bids, bidders, winners] = await Promise.all([
          prisma.prize.findMany({
            where: { isActive: true, parentPrizeId: null },
            include: {
              bids: {
                where: { status: 'WINNING' },
                include: { bidder: true },
                take: 1,
              },
              winners: {
                include: { bidder: true, bid: true },
              },
            },
            orderBy: { title: 'asc' },
          }),
          prisma.bid.count(),
          prisma.bidder.count(),
          prisma.winner.count(),
        ])

        const totalRaised = prizes.reduce((sum, p) => sum + p.currentHighestBid, 0)

        const csv = [
          ['Auction Summary Report'],
          [`Generated: ${new Date().toLocaleString()}`],
          [''],
          ['Overall Statistics'],
          [`Total Prizes,${prizes.length}`],
          [`Total Bidders,${bidders}`],
          [`Total Bids,${bids}`],
          [`Confirmed Winners,${winners}`],
          [`Total Raised,${formatCurrency(totalRaised)}`],
          [''],
          ['Prize Details'],
          ['Prize', 'Starting Bid', 'Highest Bid', 'Total Bids', 'Current Winner', 'Table', 'Confirmed'].join(','),
          ...prizes.map((p) => {
            const winningBid = p.bids[0]
            const confirmedWinner = p.winners[0]
            return [
              `"${p.title.replace(/"/g, '""')}"`,
              p.minimumBid,
              p.currentHighestBid,
              p.bids.length,
              winningBid ? `"${winningBid.bidder.name.replace(/"/g, '""')}"` : 'No bids',
              winningBid?.bidder.tableNumber || '',
              confirmedWinner ? 'Yes' : 'No',
            ].join(',')
          }),
        ].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="auction-summary-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
