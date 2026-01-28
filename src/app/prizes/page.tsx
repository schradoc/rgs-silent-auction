import { prisma } from '@/lib/prisma'
import { PrizeGrid } from '@/components/prizes/prize-grid'
import Link from 'next/link'
import { User } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getPrizes() {
  const prizes = await prisma.prize.findMany({
    where: {
      isActive: true,
      parentPrizeId: null, // Don't show variant prizes in main grid
    },
    orderBy: [
      { displayOrder: 'asc' },
      { minimumBid: 'desc' },
    ],
  })
  return prizes
}

export default async function PrizesPage() {
  const prizes = await getPrizes()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">RGS-HK Auction</h1>
              <p className="text-white/70 text-sm">30th Anniversary Gala</p>
            </div>
            <Link
              href="/my-bids"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">My Bids</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Auction Status Banner */}
        <div className="bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#1e3a5f] font-medium">Auction is OPEN</p>
              <p className="text-gray-600 text-sm">Bidding closes at 10:30pm</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#1e3a5f]">{prizes.length}</p>
              <p className="text-gray-600 text-sm">prizes available</p>
            </div>
          </div>
        </div>

        {/* Prize Grid */}
        <PrizeGrid prizes={prizes} />
      </div>
    </main>
  )
}
