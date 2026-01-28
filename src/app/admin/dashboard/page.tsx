import { AdminDashboard } from './admin-dashboard'

export const dynamic = 'force-dynamic'

async function getAdminData() {
  const { prisma } = await import('@/lib/prisma')

  const [prizes, bidders, recentBids, settings] = await Promise.all([
    prisma.prize.findMany({
      where: { isActive: true, parentPrizeId: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { bids: true } },
      },
    }),
    prisma.bidder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { bids: true } },
      },
    }),
    prisma.bid.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        bidder: { select: { name: true, tableNumber: true } },
        prize: { select: { title: true, slug: true } },
      },
    }),
    prisma.auctionSettings.findUnique({ where: { id: 'settings' } }),
  ])

  const stats = {
    totalPrizes: prizes.length,
    totalBidders: bidders.length,
    totalBids: recentBids.length,
    totalValue: prizes.reduce((sum, p) => sum + p.currentHighestBid, 0),
  }

  return { prizes, bidders, recentBids, settings, stats }
}

export default async function AdminDashboardPage() {
  const data = await getAdminData()

  return <AdminDashboard initialData={data} />
}
