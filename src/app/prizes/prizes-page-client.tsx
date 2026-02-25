'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search, Clock, X, Lock, Eye, ArrowDown,
  LayoutGrid, Landmark, Sparkles, Plane, UtensilsCrossed, Heart,
  Target, Gavel, Banknote,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import { AuctionCountdown } from '@/components/auction-countdown'
import { Header } from '@/components/layout/header'
import { useBidder } from '@/hooks/useBidder'
import type { Prize } from '@prisma/client'

const FALLBACK_IMAGE = '' // No default image - show placeholder

type PrizeWithCount = Prize & { _count?: { bids: number } }

interface PrizesPageClientProps {
  prizes: PrizeWithCount[]
}

const CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'ALL', label: 'All', icon: LayoutGrid },
  { id: 'HISTORIC_ITEMS', label: 'Historic Items', icon: Landmark },
  { id: 'EXPERIENCES', label: 'Experiences', icon: Sparkles },
  { id: 'TRAVEL', label: 'Travel', icon: Plane },
  { id: 'DINING', label: 'Dining', icon: UtensilsCrossed },
  { id: 'PLEDGES', label: 'Pledges', icon: Heart },
]

type AuctionState = 'DRAFT' | 'TESTING' | 'PRELAUNCH' | 'LIVE' | 'CLOSED'

interface AuctionStatus {
  isAuctionOpen: boolean
  auctionEndTime: string | null
  auctionState: AuctionState
}

export function PrizesPageClient({ prizes }: PrizesPageClientProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'price-high' | 'price-low'>('popular')
  const [auctionStatus, setAuctionStatus] = useState<AuctionStatus | null>(null)
  const { bidder, isLoading: bidderLoading } = useBidder()
  const isSignedIn = !!bidder
  const [winningCount, setWinningCount] = useState(0)
  const [bidStatusMap, setBidStatusMap] = useState<Record<string, 'WINNING' | 'OUTBID'>>({})
  const lotGridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    // Fetch auction status
    fetch('/api/auction-state')
      .then(res => res.json())
      .then(data => setAuctionStatus({
        isAuctionOpen: data.isOpen,
        auctionEndTime: data.endTime,
        auctionState: data.state,
      }))
      .catch(() => {})
  }, [])

  // Fetch bid statuses when bidder is available
  useEffect(() => {
    if (!bidder) return

    fetch('/api/my-bids')
      .then(res => res.ok ? res.json() : null)
      .then(bidsData => {
        if (bidsData?.bids) {
          const winning = bidsData.bids.filter((b: { status: string }) => b.status === 'WINNING').length
          setWinningCount(winning)
          const statusMap: Record<string, 'WINNING' | 'OUTBID'> = {}
          for (const b of bidsData.bids as { prize: { id: string }; status: string }[]) {
            if (!statusMap[b.prize.id] && (b.status === 'WINNING' || b.status === 'OUTBID')) {
              statusMap[b.prize.id] = b.status as 'WINNING' | 'OUTBID'
            }
          }
          setBidStatusMap(statusMap)
        }
      })
      .catch(() => {})
  }, [bidder])

  // Filter and sort prizes
  const filteredPrizes = useMemo(() => {
    let filtered = prizes

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.shortDescription.toLowerCase().includes(query)
      )
    }

    switch (sortBy) {
      case 'popular':
        filtered = [...filtered].sort((a, b) => b.currentHighestBid - a.currentHighestBid)
        break
      case 'price-high':
        filtered = [...filtered].sort((a, b) => (b.currentHighestBid || b.minimumBid) - (a.currentHighestBid || a.minimumBid))
        break
      case 'price-low':
        filtered = [...filtered].sort((a, b) => (a.currentHighestBid || a.minimumBid) - (b.currentHighestBid || b.minimumBid))
        break
    }

    return filtered
  }, [prizes, selectedCategory, searchQuery, sortBy])

  // Stats
  const stats = useMemo(() => ({
    total: prizes.length,
    withBids: prizes.filter(p => p.currentHighestBid > 0).length,
    totalValue: prizes.reduce((sum, p) => sum + p.currentHighestBid, 0),
    totalBids: prizes.reduce((sum, p) => sum + (p._count?.bids ?? 0), 0),
  }), [prizes])

  // Get auction state banner info
  const getStateBanner = () => {
    if (!auctionStatus) return null
    const { auctionState } = auctionStatus

    switch (auctionState) {
      case 'DRAFT':
      case 'TESTING':
        return {
          icon: Lock,
          bg: 'bg-purple-600',
          message: 'Preview Mode — Auction is being prepared',
        }
      case 'PRELAUNCH':
        return {
          icon: Eye,
          bg: 'bg-blue-600',
          message: 'Browse the lots! Bidding opens at the event.',
        }
      case 'CLOSED':
        return {
          icon: Lock,
          bg: 'bg-gray-600',
          message: 'Auction has ended. Thank you for participating!',
        }
      case 'LIVE':
      default:
        return null
    }
  }

  const stateBanner = getStateBanner()

  const scrollToLots = () => {
    lotGridRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* Auction State Banner */}
      {stateBanner && (
        <div className={`${stateBanner.bg} text-white py-3`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-3">
            <stateBanner.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{stateBanner.message}</span>
          </div>
        </div>
      )}

      {/* Auction Countdown Banner (only when LIVE) */}
      {auctionStatus && auctionStatus.auctionState === 'LIVE' && (
        <AuctionCountdown
          endTime={auctionStatus.auctionEndTime}
          isOpen={auctionStatus.isAuctionOpen}
          variant="banner"
        />
      )}

      {/* Header */}
      <Header />

      {/* Hero Unit */}
      <section className="relative bg-[#0f1d2d] overflow-hidden">
        {/* Topographic line pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30 50 50 T100 50' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 30 Q25 10 50 30 T100 30' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 70 Q25 50 50 70 T100 70' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 90 Q25 70 50 90 T100 90' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3Cpath d='M0 10 Q25 -10 50 10 T100 10' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }} />

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f1d2d]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-14">
          <div className="max-w-2xl">
            <p className={`text-white/50 text-xs sm:text-sm font-medium tracking-wide mb-2 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              RGS-HK 30th Anniversary
            </p>

            <h1 className={`text-[#c9a227] text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-wide uppercase mb-3 sm:mb-4 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Silent Auction
            </h1>

            <p className={`text-white/60 text-sm sm:text-base leading-relaxed mb-4 max-w-xl transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Bid on extraordinary experiences, historic items,
              and once-in-a-lifetime travel — all supporting
              geographical education in Hong Kong.
            </p>

            <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-white/40 text-xs sm:text-sm">
                28 February 2026 &middot; Hong Kong Club &middot; 150 Guests
              </p>
              <button
                onClick={scrollToLots}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium transition-all hover:border-white/30"
              >
                Browse Lots
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className={`mt-6 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-6 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-white/50" />
              </div>
              <div>
                <p className="text-[#c9a227] text-base font-semibold leading-tight">{stats.total}</p>
                <p className="text-white/30 text-[11px] uppercase tracking-wider">Lots</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Gavel className="w-4 h-4 text-white/50" />
              </div>
              <div>
                <p className="text-[#c9a227] text-base font-semibold leading-tight">{stats.withBids}</p>
                <p className="text-white/30 text-[11px] uppercase tracking-wider">Active</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Banknote className="w-4 h-4 text-white/50" />
              </div>
              <div>
                <p className="text-[#c9a227] text-base font-semibold leading-tight">
                  {stats.totalValue > 0
                    ? `HK$${Math.floor(stats.totalValue / 1000).toLocaleString()}k`
                    : 'HK$0'}
                </p>
                <p className="text-white/30 text-[11px] uppercase tracking-wider">Raised</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-white/50" />
              </div>
              <div>
                {auctionStatus?.auctionState === 'LIVE' && auctionStatus?.auctionEndTime ? (
                  <>
                    <p className="text-[#c9a227] text-base font-semibold leading-tight">
                      {new Date(auctionStatus.auctionEndTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                    <p className="text-white/30 text-[11px] uppercase tracking-wider">Closes</p>
                  </>
                ) : (
                  <>
                    <p className="text-[#c9a227] text-base font-semibold leading-tight">{stats.totalBids}</p>
                    <p className="text-white/30 text-[11px] uppercase tracking-wider">Bids</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section ref={lotGridRef} className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Mobile search */}
          <div className="sm:hidden py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
              <input
                type="text"
                placeholder="Search lots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#a08a1e]/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-[#6b6b6b]" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 overflow-x-auto scrollbar-hide">
            {/* Category pills with icons */}
            <div className="flex items-center gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                const isActive = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#0f1d2d] text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* Desktop search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
              <input
                type="text"
                placeholder="Search lots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-1.5 bg-gray-50 rounded-full text-sm w-48 focus:w-64 transition-all focus:outline-none focus:ring-2 focus:ring-[#a08a1e]/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lot Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {filteredPrizes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#6b6b6b]">No lots found</p>
              <button
                onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
                className="mt-4 text-[#a08a1e] font-medium hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPrizes.map((prize, index) => (
                <PrizeCard
                  key={prize.id}
                  prize={prize}
                  index={index}
                  mounted={mounted}
                  bidStatus={bidStatusMap[prize.id]}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#6b6b6b]/50">
        <p>Powered by Axiomcasts Limited</p>
      </footer>
    </main>
  )
}

// Prize Card — Sotheby's catalog style
function PrizeCard({ prize, index, mounted, bidStatus }: { prize: PrizeWithCount; index: number; mounted: boolean; bidStatus?: 'WINNING' | 'OUTBID' }) {
  const [imgSrc, setImgSrc] = useState(prize.imageUrl || '')
  const hasActiveBid = prize.currentHighestBid > 0
  const bidCount = prize._count?.bids ?? 0

  // Build lot number display string
  const lotLabel = prize.lotNumber
    ? `Lot ${prize.lotNumber}${prize.subLotLetter ? `.${prize.subLotLetter}` : ''}`
    : null

  return (
    <Link
      href={`/prizes/${prize.slug}`}
      className={`group block transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      style={{ transitionDelay: `${Math.min(index * 30, 200)}ms` }}
    >
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-200/60 border-l-4 border-l-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-l-[#c9a227]">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={prize.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgSrc('')}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] flex items-center justify-center">
              <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />

          {/* Lot number badge (top-left) */}
          {lotLabel && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0f1d2d]/85 backdrop-blur-sm text-white tracking-wide uppercase">
                {lotLabel}
              </span>
            </div>
          )}

          {/* Category pill (below lot number or top-left if no lot) */}
          <div className={`absolute left-3 ${lotLabel ? 'top-11' : 'top-3'}`}>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-[#6b6b6b]">
              {CATEGORY_LABELS[prize.category]}
            </span>
          </div>

          {/* Bid status badge */}
          {bidStatus && (
            <div className="absolute top-3 right-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                bidStatus === 'WINNING'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-orange-500/90 text-white'
              }`}>
                {bidStatus === 'WINNING' ? 'Winning' : 'Outbid'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium tracking-tight text-[#1a1a1a] text-base leading-snug mb-1 line-clamp-2 group-hover:text-[#0f1d2d] transition-colors">
            {prize.title}
          </h3>

          {/* Donor name */}
          {prize.donorName && (
            <p className="text-xs text-[#9b9b9b] mb-3">
              Donated by {prize.donorName}
            </p>
          )}

          {/* Quick stats row */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-[10px] text-[#9b9b9b] uppercase tracking-wider font-medium mb-0.5">
                {hasActiveBid ? 'Current Bid' : 'Starting at'}
              </p>
              <p className={`text-lg font-semibold tracking-tight ${hasActiveBid ? 'text-[#c9a227]' : 'text-[#1a1a1a]'}`}>
                {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
              </p>
            </div>

            <p className="text-xs text-[#9b9b9b] font-medium pb-0.5">
              {bidCount > 0
                ? `${bidCount} ${bidCount === 1 ? 'bid' : 'bids'}`
                : 'No bids yet'}
            </p>
          </div>
        </div>
      </article>
    </Link>
  )
}
