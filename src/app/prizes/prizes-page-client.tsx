'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Search, Clock, X, Lock, Eye, Heart, Settings, UserPlus, HelpCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import { AuctionCountdown } from '@/components/auction-countdown'
import type { Prize } from '@prisma/client'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop'

interface PrizesPageClientProps {
  prizes: Prize[]
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Prizes' },
  { id: 'TRAVEL', label: 'Travel' },
  { id: 'EXPERIENCES', label: 'Experiences' },
  { id: 'HISTORIC_ITEMS', label: 'Historic Items' },
  { id: 'DINING', label: 'Dining' },
  { id: 'PLEDGES', label: 'Pledges' },
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
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [winningCount, setWinningCount] = useState(0)
  const [bidStatusMap, setBidStatusMap] = useState<Record<string, 'WINNING' | 'OUTBID'>>({})

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

    // Check auth state
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) return res.json()
        return null
      })
      .then(data => {
        if (data?.bidder) {
          setIsSignedIn(true)
          // Fetch bid statuses for badge display
          fetch('/api/my-bids')
            .then(res => res.ok ? res.json() : null)
            .then(bidsData => {
              if (bidsData?.bids) {
                const winning = bidsData.bids.filter((b: { status: string }) => b.status === 'WINNING').length
                setWinningCount(winning)
                // Build a map of prizeId -> latest bid status
                const statusMap: Record<string, 'WINNING' | 'OUTBID'> = {}
                for (const b of bidsData.bids as { prize: { id: string }; status: string }[]) {
                  // Only record WINNING or OUTBID, keep the first (latest) per prize
                  if (!statusMap[b.prize.id] && (b.status === 'WINNING' || b.status === 'OUTBID')) {
                    statusMap[b.prize.id] = b.status as 'WINNING' | 'OUTBID'
                  }
                }
                setBidStatusMap(statusMap)
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

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
          message: 'Browse the prizes! Bidding opens at the event.',
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
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#a08a1e] to-[#7a6a16] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">RGS</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight">Silent Auction</p>
                <p className="text-[10px] text-white/50 leading-tight">30th Anniversary</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/help"
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title="How It Works"
              >
                <HelpCircle className="w-5 h-5 text-white/70 hover:text-white" />
              </Link>

              {isSignedIn ? (
                <>
                  <Link
                    href="/favorites"
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    title="Favorites"
                  >
                    <Heart className="w-5 h-5 text-white/70 hover:text-white" />
                  </Link>

                  <Link
                    href="/profile"
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    title="Profile"
                  >
                    <Settings className="w-5 h-5 text-white/70 hover:text-white" />
                  </Link>

                  <Link
                    href="/my-bids"
                    className="relative flex items-center gap-2 bg-[#a08a1e] hover:bg-[#8a7618] px-4 py-2 rounded-full transition-all text-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    <span>My Bids</span>
                    {winningCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {winningCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <Link
                  href="/register"
                  className="flex items-center gap-2 bg-[#a08a1e] hover:bg-[#8a7618] px-4 py-2 rounded-full transition-all text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Stats Bar */}
      <section className="bg-gradient-to-b from-[#0f1d2d] to-[#1a2f4a] text-white py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-white/40 text-base">
                {stats.total} prizes · {stats.withBids} with active bids
                {stats.totalValue > 0 && ` · HK$${Math.floor(stats.totalValue / 1000).toLocaleString()}k raised`}
              </p>
            </div>

            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Clock className="w-4 h-4" />
              <span>
                {auctionStatus?.auctionEndTime
                  ? `Bidding closes ${new Date(auctionStatus.auctionEndTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                  : 'Bidding closes at the event'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Mobile search */}
          <div className="sm:hidden py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
              <input
                type="text"
                placeholder="Search prizes..."
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
            {/* Category pills */}
            <div className="flex items-center gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#0f1d2d] text-white'
                      : 'bg-gray-50 text-[#6b6b6b] hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* Desktop search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b6b]" />
              <input
                type="text"
                placeholder="Search prizes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-1.5 bg-gray-50 rounded-full text-sm w-48 focus:w-64 transition-all focus:outline-none focus:ring-2 focus:ring-[#a08a1e]/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Prize Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {filteredPrizes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#6b6b6b]">No prizes found</p>
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

// Prize Card — Scandinavian design
function PrizeCard({ prize, index, mounted, bidStatus }: { prize: Prize; index: number; mounted: boolean; bidStatus?: 'WINNING' | 'OUTBID' }) {
  const [imgSrc, setImgSrc] = useState(prize.imageUrl || FALLBACK_IMAGE)
  const hasActiveBid = prize.currentHighestBid > 0

  return (
    <Link
      href={`/prizes/${prize.slug}`}
      className={`group block transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      style={{ transitionDelay: `${Math.min(index * 30, 200)}ms` }}
    >
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={imgSrc}
            alt={prize.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            unoptimized
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
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

          {/* Current bid overlay */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2">
              <p className="text-[10px] text-white/60 uppercase tracking-wider">
                {hasActiveBid ? 'Current Bid' : 'Starting at'}
              </p>
              <p className={`text-lg font-medium ${hasActiveBid ? 'text-[#c4a832]' : 'text-white'}`}>
                {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-medium text-[#1a1a1a] text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#0f1d2d] transition-colors">
            {prize.title}
          </h3>
          <p className="text-sm text-[#6b6b6b] line-clamp-2 leading-relaxed">
            {prize.shortDescription}
          </p>
        </div>
      </article>
    </Link>
  )
}
