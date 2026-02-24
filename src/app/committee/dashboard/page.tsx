'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  Users,
  Gavel,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  AlertTriangle,
  Minus,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'

interface Stats {
  totalRaised: number
  activeBidders: number
  totalBids: number
  totalPrizes: number
  prizesWithBids: number
}

interface RecentBid {
  id: string
  amount: number
  createdAt: string
  bidderName: string
  tableNumber: string | null
  prizeTitle: string
}

interface PrizeLeaderboardItem {
  id: string
  title: string
  currentBid: number
  bidCount: number
}

interface ColdPrize {
  id: string
  title: string
  currentBid: number
  minimumBid: number
  bidCount: number
}

interface TableLeaderboardItem {
  tableNumber: string
  totalValue: number
}

interface CategoryBreakdownItem {
  category: string
  value: number
  count: number
}

interface TimelineItem {
  hour: string
  bids: number
  value: number
}

interface DashboardData {
  stats: Stats
  recentBids: RecentBid[]
  prizeLeaderboard: PrizeLeaderboardItem[]
  coldPrizes: ColdPrize[]
  tableLeaderboard: TableLeaderboardItem[]
  categoryBreakdown: CategoryBreakdownItem[]
  timeline: TimelineItem[]
  auctionState: string
  auctionEndTime: string | null
}

function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayed, setDisplayed] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    const duration = 800
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(start + (end - start) * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
    prevValue.current = value
  }, [value])

  return <>{prefix}{displayed.toLocaleString()}</>
}

function TimeAgo({ date }: { date: string }) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return <>{seconds}s ago</>
  if (seconds < 3600) return <>{Math.floor(seconds / 60)}m ago</>
  return <>{Math.floor(seconds / 3600)}h ago</>
}

export default function CommitteeDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const router = useRouter()

  const fetchData = async () => {
    try {
      const res = await fetch('/api/committee/stats')
      if (res.status === 401) {
        router.push('/committee')
        return
      }
      if (res.ok) {
        const newData = await res.json()
        setData(newData)
        setLastUpdate(new Date())
        setError('')
      }
    } catch {
      setError('Failed to load data')
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0f1d2d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#b8941f]/30 border-t-[#b8941f] rounded-full animate-spin" />
      </main>
    )
  }

  const maxCategoryValue = Math.max(...data.categoryBreakdown.map(c => c.value), 1)
  const maxTimelineBids = Math.max(...data.timeline.map(t => t.bids), 1)

  return (
    <main className="min-h-screen bg-[#0f1d2d] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1d2d]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#d4af37]" />
            <h1 className="font-semibold text-lg">Live Analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${data.auctionState === 'LIVE' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            <span className="text-xs text-white/50">
              {data.auctionState === 'LIVE' ? 'LIVE' : data.auctionState}
            </span>
            {lastUpdate && (
              <span className="text-xs text-white/30 ml-2">
                {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="text-red-400 text-xs text-center">{error}</div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#b8941f]/20 to-[#b8941f]/5 rounded-xl p-4 border border-[#b8941f]/20">
            <DollarSign className="w-5 h-5 text-[#d4af37] mb-1" />
            <p className="text-2xl font-bold text-[#d4af37]">
              <AnimatedCounter value={data.stats.totalRaised} prefix="$" />
            </p>
            <p className="text-xs text-white/50">Total Raised</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <Users className="w-5 h-5 text-blue-400 mb-1" />
            <p className="text-2xl font-bold">
              <AnimatedCounter value={data.stats.activeBidders} />
            </p>
            <p className="text-xs text-white/50">Active Bidders</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <Gavel className="w-5 h-5 text-purple-400 mb-1" />
            <p className="text-2xl font-bold">
              <AnimatedCounter value={data.stats.totalBids} />
            </p>
            <p className="text-xs text-white/50">Total Bids</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <Trophy className="w-5 h-5 text-green-400 mb-1" />
            <p className="text-2xl font-bold">
              <AnimatedCounter value={data.stats.prizesWithBids} />
              <span className="text-sm font-normal text-white/40">/{data.stats.totalPrizes}</span>
            </p>
            <p className="text-xs text-white/50">Prizes with Bids</p>
          </div>
        </div>

        {/* Live Bid Feed */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Live Bid Feed</h2>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5">
            {data.recentBids.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-sm">Waiting for bids...</div>
            ) : (
              data.recentBids.map((bid) => (
                <div key={bid.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bid.prizeTitle}</p>
                    <p className="text-xs text-white/40">
                      {bid.bidderName}
                      {bid.tableNumber ? ` · Table ${bid.tableNumber}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-[#d4af37]">{formatCurrency(bid.amount)}</p>
                    <p className="text-xs text-white/30">
                      <TimeAgo date={bid.createdAt} />
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Prize Leaderboard */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Top Prizes</h2>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5">
            {data.prizeLeaderboard.map((prize, index) => (
              <div key={prize.id} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  index === 0 ? 'bg-[#d4af37] text-[#0f1d2d]' :
                  index === 1 ? 'bg-gray-400 text-[#0f1d2d]' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-white/10 text-white/50'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{prize.title}</p>
                  <p className="text-xs text-white/40">{prize.bidCount} bid{prize.bidCount !== 1 ? 's' : ''}</p>
                </div>
                <p className="text-sm font-bold text-[#d4af37] flex-shrink-0">
                  {formatCurrency(prize.currentBid)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cold Prizes */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Needs Promotion</h2>
          </div>
          <div className="bg-white/5 rounded-xl border border-orange-500/20 divide-y divide-white/5">
            {data.coldPrizes.filter(p => p.bidCount <= 2).slice(0, 5).map((prize) => (
              <div key={prize.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{prize.title}</p>
                  <p className="text-xs text-white/40">
                    Min: {formatCurrency(prize.minimumBid)}
                    {prize.bidCount > 0 ? ` · ${prize.bidCount} bid${prize.bidCount !== 1 ? 's' : ''}` : ''}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                  prize.bidCount === 0 ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
                }`}>
                  {prize.bidCount === 0 ? 'No bids' : `${prize.bidCount} bid${prize.bidCount !== 1 ? 's' : ''}`}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Table Leaderboard */}
        {data.tableLeaderboard.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Table Leaderboard</h2>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5">
              {data.tableLeaderboard.map((table, index) => (
                <div key={table.tableNumber} className="px-4 py-3 flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    index === 0 ? 'bg-blue-500 text-white' :
                    index === 1 ? 'bg-blue-400/50 text-white' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Table {table.tableNumber}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-400 flex-shrink-0">
                    {formatCurrency(table.totalValue)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Category Breakdown */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">By Category</h2>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            {data.categoryBreakdown.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white/70">
                    {CATEGORY_LABELS[cat.category as keyof typeof CATEGORY_LABELS] || cat.category}
                  </span>
                  <span className="font-medium text-[#d4af37]">{formatCurrency(cat.value)}</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#b8941f] to-[#d4af37] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max((cat.value / maxCategoryValue) * 100, 2)}%` }}
                  />
                </div>
                <p className="text-xs text-white/30 mt-0.5">{cat.count} prize{cat.count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bid Timeline */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">Bid Activity (Last 4 Hours)</h2>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-end gap-2 h-32">
              {data.timeline.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-white/50">{item.bids}</span>
                  <div className="w-full bg-white/5 rounded-t-lg overflow-hidden flex-1 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-green-500/60 to-green-400/30 rounded-t-lg transition-all duration-1000"
                      style={{ height: `${Math.max((item.bids / maxTimelineBids) * 100, 5)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30">{item.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </main>
  )
}
