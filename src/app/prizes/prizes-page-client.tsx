'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Search, Filter, Flame, Clock, ArrowUpRight, X, Lock, Eye, Rocket } from 'lucide-react'
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

  // Filter and sort prizes
  const filteredPrizes = useMemo(() => {
    let filtered = prizes

    // Category filter
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.shortDescription.toLowerCase().includes(query)
      )
    }

    // Sort
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
          message: 'Preview Mode - Auction is being prepared',
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
        return null // Show countdown instead
    }
  }

  const stateBanner = getStateBanner()

  return (
    <main className="min-h-screen bg-[#fafaf8]">
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
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#b8941f] to-[#8a6f17] flex items-center justify-center shadow-lg shadow-[#b8941f]/20">
                <span className="text-white text-[10px] font-bold">RGS</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight">Silent Auction</p>
                <p className="text-[10px] text-white/50 leading-tight">30th Anniversary</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                <span className="text-white/70 text-xs">Live</span>
              </div>

              <Link
                href="/my-bids"
                className="flex items-center gap-2 bg-[#b8941f] hover:bg-[#a3821b] px-4 py-2 rounded-full transition-all text-sm font-medium"
              >
                <User className="w-4 h-4" />
                <span>My Bids</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Stats Bar */}
      <section className="bg-gradient-to-b from-[#0f1d2d] to-[#1a2f4a] text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#b8941f]/20 border border-[#b8941f]/30">
                  <Flame className="w-3.5 h-3.5 text-[#b8941f]" />
                  <span className="text-[#b8941f] text-xs font-medium">{stats.withBids} items with active bids</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-2">
                Discover & Bid
              </h1>
              <p className="text-white/50 text-base">
                {stats.total} extraordinary prizes • HK${Math.floor(stats.totalValue / 1000).toLocaleString()}k in current bids
              </p>
            </div>

            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Clock className="w-4 h-4" />
              <span>Bidding closes 10:30pm</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 py-4 overflow-x-auto scrollbar-hide">
            {/* Category pills */}
            <div className="flex items-center gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#0f1d2d] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search prizes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm w-48 focus:w-64 transition-all focus:outline-none focus:ring-2 focus:ring-[#b8941f]/20"
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
              <p className="text-gray-500">No prizes found</p>
              <button
                onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
                className="mt-4 text-[#b8941f] font-medium hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrizes.map((prize, index) => (
                <PrizeCard
                  key={prize.id}
                  prize={prize}
                  index={index}
                  mounted={mounted}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

// Enhanced Prize Card
function PrizeCard({ prize, index, mounted }: { prize: Prize; index: number; mounted: boolean }) {
  const [imgSrc, setImgSrc] = useState(prize.imageUrl || FALLBACK_IMAGE)
  const hasActiveBid = prize.currentHighestBid > 0

  // Simulated "hot" indicator for items with many bids
  const isHot = prize.currentHighestBid > prize.minimumBid * 1.5

  return (
    <Link
      href={`/prizes/${prize.slug}`}
      className={`group block transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imgSrc}
            alt={prize.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            unoptimized
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

          {/* Category & Hot badge */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-gray-700">
              {CATEGORY_LABELS[prize.category]}
            </span>
            {isHot && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                <Flame className="w-3 h-3" />
                Hot
              </span>
            )}
          </div>

          {/* Quick view indicator */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-900">
              View Prize
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          {/* Current bid overlay */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2">
              <p className="text-[10px] text-white/60 uppercase tracking-wider">
                {hasActiveBid ? 'Current Bid' : 'Starting at'}
              </p>
              <p className={`text-lg font-semibold ${hasActiveBid ? 'text-[#b8941f]' : 'text-white'}`}>
                {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-medium text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#0f1d2d] transition-colors">
            {prize.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {prize.shortDescription}
          </p>
        </div>
      </article>
    </Link>
  )
}
