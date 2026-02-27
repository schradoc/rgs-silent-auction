'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy,
  Users,
  TrendingUp,
  Zap,
  RefreshCw,
  LogOut,
  Crown,
  Medal,
  Award,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Plus,
  Hash,
  Clock,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// ── Types ──

interface HelperStats {
  id: string
  name: string
  avatarColor: string
  totalBids: number
  totalValue: number
  uniqueBidders: number
  streak: number
  rank: number
  isCurrentHelper: boolean
}

interface RecentBid {
  id: string
  amount: number
  createdAt: string
  bidder: { name: string; tableNumber: string }
  prize: { title: string; slug: string }
}

interface OutbidAlert {
  id: string
  amount: number
  createdAt: string
  bidder: { name: string; tableNumber: string }
  prize: { title: string; slug: string; currentHighestBid: number; lotNumber: number | null }
}

interface TableBid {
  bidderName: string
  prizeTitle: string
  lotNumber: number | null
  amount: number
  status: string
  createdAt: string
}

interface TableActivityEntry {
  tableNumber: string
  winningCount: number
  outbidCount: number
  totalValue: number
  bids: TableBid[]
}

interface LiveFeedEntry {
  id: string
  amount: number
  status: string
  createdAt: string
  bidderName: string
  tableNumber: string | null
  prizeTitle: string
  lotNumber: number | null
  currentHighestBid: number
}

interface DashboardData {
  helper: { id: string; name: string; avatarColor: string; assignedTables: string | null }
  stats: HelperStats
  leaderboard: HelperStats[]
  recentBids: RecentBid[]
  outbidAlerts: OutbidAlert[]
  tableActivity?: TableActivityEntry[]
  liveFeed?: LiveFeedEntry[]
}

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  return `${hours}h ago`
}

function lotLabel(lotNumber: number | null): string {
  return lotNumber ? `Lot ${lotNumber}` : ''
}

// ── Page ──

export default function HelperDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'tables' | 'feed' | 'stats'>('tables')
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-expand assigned tables on first load
  useEffect(() => {
    if (data?.helper.assignedTables && expandedTables.size === 0) {
      const assigned = data.helper.assignedTables.split(',').map(t => t.trim())
      setExpandedTables(new Set(assigned))
    }
  }, [data?.helper.assignedTables])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/helpers/dashboard')
      if (res.status === 401) {
        router.push('/helper')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setData(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboard()
  }

  const handleLogout = async () => {
    await fetch('/api/helpers/logout', { method: 'POST' })
    router.push('/helper')
  }

  const myTables = data?.helper.assignedTables?.split(',').map(t => t.trim()) || []

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f1d2d] via-[#1a2f4a] to-[#0f1d2d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#b8941f]/30 border-t-[#b8941f] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0f1d2d] via-[#1a2f4a] to-[#0f1d2d] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 mb-4">Failed to load dashboard</p>
          <button onClick={handleRefresh} className="text-[#b8941f] hover:underline">
            Try again
          </button>
        </div>
      </main>
    )
  }

  const outbidCount = data.outbidAlerts?.length || 0

  // Split table activity into assigned vs others
  const assignedTableActivity = (data.tableActivity || []).filter(t => myTables.includes(t.tableNumber))
  const otherTableActivity = (data.tableActivity || []).filter(t => !myTables.includes(t.tableNumber))

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f1d2d] via-[#1a2f4a] to-[#0f1d2d] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1d2d]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: data.helper.avatarColor }}
            >
              {data.helper.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-white font-semibold">{data.helper.name}</h1>
              {myTables.length > 0 && (
                <p className="text-blue-300 text-xs">
                  Tables {myTables.join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-white/70 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* ── Outbid Alerts (always visible at top) ── */}
        {outbidCount > 0 && (
          <section className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h2 className="text-orange-300 text-sm font-semibold">
                  {outbidCount} bidder{outbidCount !== 1 ? 's' : ''} outbid — prompt them to rebid!
                </h2>
              </div>
              <div className="space-y-1.5">
                {data.outbidAlerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href={`/helper/submit-bid?bidder=${encodeURIComponent(alert.bidder.name)}&table=${alert.bidder.tableNumber}&prize=${alert.prize.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-200 flex-shrink-0">
                      {alert.bidder.tableNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {alert.bidder.name}
                      </p>
                      <p className="text-orange-300/80 text-xs truncate">
                        {lotLabel(alert.prize.lotNumber)} {alert.prize.title}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-orange-300 text-xs">Now</p>
                      <p className="text-white text-sm font-semibold">{formatCurrency(alert.prize.currentHighestBid)}</p>
                    </div>
                    <ArrowUpCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Tab Navigation ── */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {[
            { id: 'tables' as const, label: 'My Tables', icon: Hash },
            { id: 'feed' as const, label: 'Live Feed', icon: Activity },
            { id: 'stats' as const, label: 'Stats', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── TAB: My Tables ── */}
        {activeTab === 'tables' && (
          <section className={`space-y-3 transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {/* Assigned tables first */}
            {assignedTableActivity.length > 0 && (
              <div>
                <h3 className="text-blue-300 text-xs font-medium mb-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Your Tables
                </h3>
                <div className="bg-white/5 rounded-xl overflow-hidden border border-blue-500/20">
                  {assignedTableActivity.map((table, index) => (
                    <TableRow
                      key={table.tableNumber}
                      table={table}
                      isAssigned
                      isLast={index === assignedTableActivity.length - 1}
                      expanded={expandedTables.has(table.tableNumber)}
                      onToggle={() => {
                        setExpandedTables(prev => {
                          const next = new Set(prev)
                          if (next.has(table.tableNumber)) next.delete(table.tableNumber)
                          else next.add(table.tableNumber)
                          return next
                        })
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other tables */}
            {otherTableActivity.length > 0 && (
              <div>
                <h3 className="text-white/40 text-xs font-medium mb-2">Other Tables</h3>
                <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                  {otherTableActivity.map((table, index) => (
                    <TableRow
                      key={table.tableNumber}
                      table={table}
                      isAssigned={false}
                      isLast={index === otherTableActivity.length - 1}
                      expanded={expandedTables.has(table.tableNumber)}
                      onToggle={() => {
                        setExpandedTables(prev => {
                          const next = new Set(prev)
                          if (next.has(table.tableNumber)) next.delete(table.tableNumber)
                          else next.add(table.tableNumber)
                          return next
                        })
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {(!data.tableActivity || data.tableActivity.length === 0) && (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <Hash className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">No table activity yet</p>
                <p className="text-white/30 text-xs">Bids will appear here once guests start bidding</p>
              </div>
            )}
          </section>
        )}

        {/* ── TAB: Live Feed ── */}
        {activeTab === 'feed' && (
          <section className={`transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {data.liveFeed && data.liveFeed.length > 0 ? (
              <div className="space-y-1.5">
                {data.liveFeed.map((entry) => {
                  const isMyTable = entry.tableNumber ? myTables.includes(entry.tableNumber) : false
                  const isWinning = entry.status === 'WINNING'
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        isMyTable
                          ? 'bg-blue-500/5 border-blue-500/20'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      {/* Table badge */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isMyTable
                          ? 'bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/40'
                          : 'bg-white/10 text-white/40'
                      }`}>
                        {entry.tableNumber || '?'}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-white text-sm font-medium truncate">{entry.bidderName}</p>
                          {isMyTable && <span className="text-blue-300 text-[10px] font-medium">(yours)</span>}
                        </div>
                        <p className="text-white/50 text-xs truncate">
                          {lotLabel(entry.lotNumber)} {entry.prizeTitle}
                        </p>
                      </div>

                      {/* Amount + status */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-[#b8941f] text-sm font-semibold">{formatCurrency(entry.amount)}</p>
                        <div className="flex items-center justify-end gap-1">
                          {isWinning ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-orange-400" />
                          )}
                          <span className={`text-[10px] ${isWinning ? 'text-green-400' : 'text-orange-400'}`}>
                            {entry.status === 'WINNING' ? 'Winning' : entry.status === 'OUTBID' ? 'Outbid' : entry.status}
                          </span>
                        </div>
                      </div>

                      {/* Time */}
                      <span className="text-white/30 text-[10px] flex-shrink-0 w-10 text-right">
                        {timeAgo(entry.createdAt)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <Activity className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">No bids yet</p>
                <p className="text-white/30 text-xs">Live bid activity will appear here</p>
              </div>
            )}
          </section>
        )}

        {/* ── TAB: Stats ── */}
        {activeTab === 'stats' && (
          <section className={`space-y-4 transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Total Bids"
                value={data.stats?.totalBids || 0}
                color="blue"
              />
              <StatCard
                icon={<Zap className="w-5 h-5" />}
                label="Total Value"
                value={formatCurrency(data.stats?.totalValue || 0)}
                color="gold"
              />
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="Bidders Helped"
                value={data.stats?.uniqueBidders || 0}
                color="purple"
              />
              <StatCard
                icon={<Trophy className="w-5 h-5" />}
                label="Win Streak"
                value={data.stats?.streak || 0}
                color="green"
              />
            </div>

            {/* Leaderboard */}
            <div>
              <h3 className="text-white/40 text-xs font-medium mb-2 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                Helper Leaderboard
              </h3>
              <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                {data.leaderboard.map((helper, index) => (
                  <div
                    key={helper.id}
                    className={`flex items-center gap-3 p-3 ${
                      index !== data.leaderboard.length - 1 ? 'border-b border-white/10' : ''
                    } ${helper.isCurrentHelper ? 'bg-[#b8941f]/10' : ''}`}
                  >
                    <div className="w-6 flex justify-center">{getRankIcon(helper.rank)}</div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: helper.avatarColor }}
                    >
                      {helper.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${helper.isCurrentHelper ? 'text-[#b8941f]' : 'text-white'}`}>
                        {helper.name}{helper.isCurrentHelper && ' (You)'}
                      </p>
                      <p className="text-white/50 text-xs">
                        {helper.totalBids} bids · {helper.uniqueBidders} bidders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#b8941f] font-semibold text-sm">{formatCurrency(helper.totalValue)}</p>
                      {helper.streak > 0 && (
                        <p className="text-green-400 text-xs flex items-center justify-end gap-1">
                          <Zap className="w-3 h-3" />{helper.streak}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent bids by this helper */}
            {data.recentBids.length > 0 && (
              <div>
                <h3 className="text-white/40 text-xs font-medium mb-2">Your Recent Bids</h3>
                <div className="space-y-1.5">
                  {data.recentBids.map((bid) => (
                    <div key={bid.id} className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{bid.prize.title}</p>
                        <p className="text-white/50 text-xs">{bid.bidder.name} · Table {bid.bidder.tableNumber}</p>
                      </div>
                      <p className="text-[#b8941f] font-semibold text-sm whitespace-nowrap">{formatCurrency(bid.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0f1d2d] via-[#0f1d2d] to-transparent pt-8 pb-6 px-4">
        <div className="max-w-lg mx-auto">
          <Link
            href="/helper/submit-bid"
            className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white text-center shadow-lg shadow-[#b8941f]/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Submit a Bid
          </Link>
        </div>
      </div>
    </main>
  )
}

// ── Components ──

function TableRow({
  table,
  isAssigned,
  isLast,
  expanded,
  onToggle,
}: {
  table: TableActivityEntry
  isAssigned: boolean
  isLast: boolean
  expanded: boolean
  onToggle: () => void
}) {
  // Sort bids: outbid first, then by time (newest first)
  const sortedBids = [...table.bids].sort((a, b) => {
    if (a.status === 'OUTBID' && b.status !== 'OUTBID') return -1
    if (a.status !== 'OUTBID' && b.status === 'OUTBID') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors ${
          !isLast && !expanded ? 'border-b border-white/10' : ''
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isAssigned ? 'bg-blue-500/40 text-blue-300 ring-1 ring-blue-400/50' : 'bg-white/10 text-white/50'
        }`}>
          {table.tableNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">
            Table {table.tableNumber}
          </p>
          <p className="text-white/50 text-xs">
            {formatCurrency(table.totalValue)} total · {table.winningCount + table.outbidCount} bids
          </p>
        </div>
        <div className="flex items-center gap-2">
          {table.winningCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
              {table.winningCount} winning
            </span>
          )}
          {table.outbidCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 animate-pulse">
              {table.outbidCount} outbid
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/40" />
          )}
        </div>
      </button>
      {expanded && (
        <div className={`px-3 pb-3 space-y-1 ${!isLast ? 'border-b border-white/10' : ''}`}>
          {sortedBids.map((bid, bidIdx) => {
            const isOutbid = bid.status === 'OUTBID'
            return (
              <div key={bidIdx} className={`flex items-center justify-between gap-2 py-2 px-3 rounded-lg ${
                isOutbid ? 'bg-orange-500/10' : 'bg-white/5'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isOutbid ? (
                      <XCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    )}
                    <p className="text-white/90 text-xs font-medium truncate">{bid.bidderName}</p>
                  </div>
                  <p className="text-white/40 text-xs truncate pl-5">
                    {lotLabel(bid.lotNumber)} {bid.prizeTitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[#b8941f] text-xs font-medium">{formatCurrency(bid.amount)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    isOutbid ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'
                  }`}>
                    {isOutbid ? 'OUTBID' : 'WINNING'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'blue' | 'gold' | 'purple' | 'green'
}) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    gold: 'from-[#b8941f]/20 to-[#d4af37]/10 border-[#b8941f]/30 text-[#b8941f]',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-white text-2xl font-bold">{value}</p>
      <p className="text-white/50 text-xs">{label}</p>
    </div>
  )
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400" />
    case 2:
      return <Medal className="w-5 h-5 text-gray-300" />
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />
    default:
      return <span className="w-5 text-center text-white/40 text-sm">#{rank}</span>
  }
}
