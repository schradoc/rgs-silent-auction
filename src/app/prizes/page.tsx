import { getPrizes } from '@/lib/db'
import { PrizeGrid } from '@/components/prizes/prize-grid'
import Link from 'next/link'
import { User, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PrizesPage() {
  const prizes = await getPrizes()

  return (
    <main className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="bg-[#1a2f4a] text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-colors group-hover:bg-white/20">
                <span className="text-xs font-semibold">RGS</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">Silent Auction</p>
                <p className="text-xs text-white/50">30th Anniversary</p>
              </div>
            </Link>
            <Link
              href="/my-bids"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all border border-white/10 hover:border-white/20"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">My Bids</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#1a2f4a] to-[#1a2f4a]/95 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#b8941f]/20 border border-[#b8941f]/30 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b8941f] animate-pulse" />
                <span className="text-[#b8941f] text-xs font-medium tracking-wide uppercase">Auction Open</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2">
                Browse Prizes
              </h1>
              <p className="text-white/60 text-base">
                {prizes.length} exclusive items available for bidding
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/50 text-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Sparkles className="w-4 h-4" />
              <span>Bidding closes 10:30pm</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Prize Grid */}
        <div className="stagger-children">
          <PrizeGrid prizes={prizes as any} />
        </div>
      </div>

      {/* Bottom padding for mobile */}
      <div className="h-8" />
    </main>
  )
}
