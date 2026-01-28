'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Trophy,
  Users,
  Clock,
  TrendingUp,
  Flame,
  Crown,
  Sparkles,
  Zap,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import QRCode from 'react-qr-code'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop'

interface LiveData {
  stats: {
    totalRaised: number
    activeBidders: number
    totalBids: number
    totalPrizes: number
  }
  settings: {
    isAuctionOpen: boolean
    auctionEndTime: string | null
  }
  recentBids: Array<{
    id: string
    amount: number
    createdAt: string
    bidder: { name: string; tableNumber: string }
    prize: { title: string; slug: string; imageUrl: string }
  }>
  hotItems: Array<{
    id: string
    title: string
    imageUrl: string
    currentHighestBid: number
    _count: { bids: number }
  }>
  topTables: Array<{
    tableNumber: string
    totalValue: number
  }>
  helperLeaderboard: Array<{
    id: string
    name: string
    avatarColor: string
    totalBids: number
    totalValue: number
  }>
  featuredPrize: {
    id: string
    title: string
    imageUrl: string
    shortDescription: string
    currentHighestBid: number
    minimumBid: number
    _count: { bids: number }
  } | null
}

type DisplayMode = 'bids' | 'hot' | 'tables' | 'featured' | 'helpers'
const DISPLAY_MODES: DisplayMode[] = ['bids', 'hot', 'tables', 'featured', 'helpers']
const MODE_DURATION = 8000 // 8 seconds per mode

export default function LiveDisplayPage() {
  const [data, setData] = useState<LiveData | null>(null)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('bids')
  const [modeIndex, setModeIndex] = useState(0)
  const [animatedTotal, setAnimatedTotal] = useState(0)
  const [newBid, setNewBid] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/live')
      if (res.ok) {
        const newData = await res.json()

        // Check for new bids
        if (data?.recentBids && newData.recentBids) {
          const latestOld = data.recentBids[0]?.id
          const latestNew = newData.recentBids[0]?.id
          if (latestNew && latestNew !== latestOld) {
            setNewBid(latestNew)
            setTimeout(() => setNewBid(null), 3000)
          }
        }

        setData(newData)
      }
    } catch (error) {
      console.error('Failed to fetch live data:', error)
    }
  }, [data?.recentBids])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [])

  // Rotate display modes
  useEffect(() => {
    const interval = setInterval(() => {
      setModeIndex((prev) => (prev + 1) % DISPLAY_MODES.length)
    }, MODE_DURATION)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setDisplayMode(DISPLAY_MODES[modeIndex])
  }, [modeIndex])

  // Animate total counter
  useEffect(() => {
    if (!data) return
    const target = data.stats.totalRaised
    const duration = 1000
    const steps = 30
    const increment = (target - animatedTotal) / steps
    let current = animatedTotal

    const timer = setInterval(() => {
      current += increment
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        current = target
        clearInterval(timer)
      }
      setAnimatedTotal(Math.round(current))
    }, duration / steps)

    return () => clearInterval(timer)
  }, [data?.stats.totalRaised])

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!data?.settings.auctionEndTime) return null
    const end = new Date(data.settings.auctionEndTime).getTime()
    const now = Date.now()
    const diff = end - now

    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { hours, minutes, seconds }
  }

  const timeRemaining = getTimeRemaining()

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0a141f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#b8941f]/30 border-t-[#b8941f] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-xl">Loading live display...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a141f] text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#b8941f]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-screen flex flex-col p-8">
        {/* Header Stats */}
        <header className="flex items-center justify-between mb-8">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b8941f] to-[#d4af37] flex items-center justify-center">
              <span className="text-2xl font-bold">RGS</span>
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-wide">30th Anniversary Gala</h1>
              <p className="text-white/50">Silent Auction</p>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-white/50 text-sm">Total Raised</p>
              <p className="text-5xl font-bold text-[#b8941f] tracking-tight">
                {formatCurrency(animatedTotal)}
              </p>
            </div>

            <div className="h-16 w-px bg-white/10" />

            <div className="flex gap-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-1">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-2xl font-bold">{data.stats.activeBidders}</p>
                <p className="text-white/40 text-xs">Bidders</p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-1">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-2xl font-bold">{data.stats.totalBids}</p>
                <p className="text-white/40 text-xs">Total Bids</p>
              </div>

              {timeRemaining && (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-1">
                    <Clock className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    {String(timeRemaining.hours).padStart(2, '0')}:
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </p>
                  <p className="text-red-400 text-xs">Remaining</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-8">
          {/* Left: Main Display */}
          <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-8 overflow-hidden">
            {displayMode === 'bids' && (
              <RecentBidsDisplay bids={data.recentBids} newBidId={newBid} />
            )}
            {displayMode === 'hot' && (
              <HotItemsDisplay items={data.hotItems} />
            )}
            {displayMode === 'tables' && (
              <TopTablesDisplay tables={data.topTables} />
            )}
            {displayMode === 'featured' && data.featuredPrize && (
              <FeaturedPrizeDisplay prize={data.featuredPrize} />
            )}
            {displayMode === 'helpers' && (
              <HelperLeaderboardDisplay helpers={data.helperLeaderboard} />
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="w-80 flex flex-col gap-6">
            {/* QR Code */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
              <div className="bg-white p-4 rounded-xl inline-block mb-3">
                <QRCode
                  value="https://rgs-auction.vercel.app/prizes"
                  size={140}
                  level="M"
                />
              </div>
              <p className="text-lg font-medium mb-1">Scan to Bid</p>
              <p className="text-white/40 text-sm">rgs-auction.vercel.app</p>
            </div>

            {/* Live Feed Mini */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-4 overflow-hidden">
              <h3 className="text-white/50 text-sm font-medium mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Feed
              </h3>
              <div className="space-y-3">
                {data.recentBids.slice(0, 5).map((bid, i) => (
                  <div
                    key={bid.id}
                    className={`text-sm ${i === 0 && newBid === bid.id ? 'animate-flash' : ''}`}
                  >
                    <p className="text-white font-medium truncate">
                      Table {bid.bidder.tableNumber} bid {formatCurrency(bid.amount)}
                    </p>
                    <p className="text-white/40 text-xs truncate">{bid.prize.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode Indicator */}
            <div className="flex justify-center gap-2">
              {DISPLAY_MODES.map((mode, i) => (
                <div
                  key={mode}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === modeIndex ? 'bg-[#b8941f] w-6' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes flash {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(184, 148, 31, 0.3); }
        }
        .animate-flash {
          animation: flash 0.5s ease-in-out 3;
          border-radius: 8px;
          padding: 4px 8px;
          margin: -4px -8px;
        }
      `}</style>
    </main>
  )
}

function RecentBidsDisplay({ bids, newBidId }: {
  bids: LiveData['recentBids']
  newBidId: string | null
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#b8941f]/20 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-[#b8941f]" />
        </div>
        <div>
          <h2 className="text-2xl font-light">Recent Bids</h2>
          <p className="text-white/50 text-sm">Watch the action unfold</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
        {bids.slice(0, 6).map((bid, i) => (
          <BidCard
            key={bid.id}
            bid={bid}
            isNew={bid.id === newBidId}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}

function BidCard({ bid, isNew, index }: {
  bid: LiveData['recentBids'][0]
  isNew: boolean
  index: number
}) {
  const [imgSrc, setImgSrc] = useState(bid.prize.imageUrl || FALLBACK_IMAGE)

  return (
    <div
      className={`bg-white/5 rounded-xl p-4 border transition-all duration-500 ${
        isNew ? 'border-[#b8941f] scale-105 shadow-lg shadow-[#b8941f]/20' : 'border-white/5'
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex gap-3">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={imgSrc}
            alt={bid.prize.title}
            fill
            className="object-cover"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{bid.prize.title}</p>
          <p className="text-white/50 text-xs">Table {bid.bidder.tableNumber}</p>
          <p className="text-[#b8941f] font-bold text-lg mt-1">{formatCurrency(bid.amount)}</p>
        </div>
      </div>
    </div>
  )
}

function HotItemsDisplay({ items }: { items: LiveData['hotItems'] }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Flame className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-light">Hot Items</h2>
          <p className="text-white/50 text-sm">Most activity in the last 30 minutes</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-5 gap-4">
        {items.map((item, i) => (
          <HotItemCard key={item.id} item={item} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}

function HotItemCard({ item, rank }: { item: LiveData['hotItems'][0]; rank: number }) {
  const [imgSrc, setImgSrc] = useState(item.imageUrl || FALLBACK_IMAGE)

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden border border-white/5 group">
      <div className="relative aspect-square">
        <Image
          src={imgSrc}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          unoptimized
        />
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold">
          {rank}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[#b8941f] font-bold">{formatCurrency(item.currentHighestBid)}</p>
          <p className="text-white text-xs truncate">{item.title}</p>
        </div>
      </div>
    </div>
  )
}

function TopTablesDisplay({ tables }: { tables: LiveData['topTables'] }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-light">Table Leaderboard</h2>
          <p className="text-white/50 text-sm">Who will be crowned top table?</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        {tables.map((table, i) => (
          <div
            key={table.tableNumber}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
              i === 0 ? 'bg-[#b8941f]/20 scale-105' : 'bg-white/5'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
              i === 0 ? 'bg-[#b8941f] text-white' :
              i === 1 ? 'bg-gray-300 text-gray-800' :
              i === 2 ? 'bg-amber-700 text-white' :
              'bg-white/10 text-white/50'
            }`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold">Table {table.tableNumber}</p>
            </div>
            <p className={`text-3xl font-bold ${i === 0 ? 'text-[#b8941f]' : 'text-white'}`}>
              {formatCurrency(table.totalValue)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeaturedPrizeDisplay({ prize }: { prize: NonNullable<LiveData['featuredPrize']> }) {
  const [imgSrc, setImgSrc] = useState(prize.imageUrl || FALLBACK_IMAGE)

  return (
    <div className="h-full flex gap-8">
      <div className="flex-1 relative rounded-2xl overflow-hidden">
        <Image
          src={imgSrc}
          alt={prize.title}
          fill
          className="object-cover"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#b8941f]" />
          <span className="text-[#b8941f] font-medium">Featured Prize</span>
        </div>

        <h2 className="text-4xl font-light mb-4 leading-tight">{prize.title}</h2>
        <p className="text-white/60 text-lg mb-8">{prize.shortDescription}</p>

        <div className="space-y-4">
          <div>
            <p className="text-white/40 text-sm">Current Highest Bid</p>
            <p className="text-5xl font-bold text-[#b8941f]">{formatCurrency(prize.currentHighestBid)}</p>
          </div>

          <div className="flex gap-8">
            <div>
              <p className="text-white/40 text-sm">Minimum Bid</p>
              <p className="text-xl">{formatCurrency(prize.minimumBid)}</p>
            </div>
            <div>
              <p className="text-white/40 text-sm">Total Bids</p>
              <p className="text-xl">{prize._count.bids}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-[#b8941f]/20 rounded-xl border border-[#b8941f]/30">
          <p className="text-[#b8941f] text-lg font-medium flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Scan the QR code to bid now!
          </p>
        </div>
      </div>
    </div>
  )
}

function HelperLeaderboardDisplay({ helpers }: { helpers: LiveData['helperLeaderboard'] }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Crown className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-2xl font-light">Helper Champions</h2>
          <p className="text-white/50 text-sm">Our amazing volunteers driving the auction</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        {helpers.map((helper, i) => (
          <div
            key={helper.id}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
              i === 0 ? 'bg-yellow-500/20 scale-105' : 'bg-white/5'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
              i === 0 ? 'ring-4 ring-yellow-400' : ''
            }`} style={{ backgroundColor: helper.avatarColor }}>
              {helper.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-xl font-medium">{helper.name}</p>
              <p className="text-white/50 text-sm">{helper.totalBids} bids facilitated</p>
            </div>
            <p className={`text-2xl font-bold ${i === 0 ? 'text-yellow-400' : 'text-white'}`}>
              {formatCurrency(helper.totalValue)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
