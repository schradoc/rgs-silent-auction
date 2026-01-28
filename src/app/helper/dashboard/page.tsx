'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy,
  Users,
  TrendingUp,
  Zap,
  FileText,
  RefreshCw,
  LogOut,
  Crown,
  Medal,
  Award,
  AlertTriangle,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface HelperStats {
  id: string
  name: string
  avatarColor: string
  totalBids: number
  totalValue: number
  uniqueBidders: number
  paperBidsCount: number
  streak: number
  rank: number
  isCurrentHelper: boolean
}

interface RecentBid {
  id: string
  amount: number
  createdAt: string
  isPaperBid: boolean
  bidder: { name: string; tableNumber: string }
  prize: { title: string; slug: string }
}

interface OutbidAlert {
  id: string
  amount: number
  bidder: { name: string; tableNumber: string }
  prize: { title: string; slug: string; currentHighestBid: number }
}

interface DashboardData {
  helper: { id: string; name: string; avatarColor: string }
  stats: HelperStats
  leaderboard: HelperStats[]
  recentBids: RecentBid[]
  outbidAlerts: OutbidAlert[]
}

export default function HelperDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    fetchDashboard()

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchDashboard, 5000)
    return () => clearInterval(interval)
  }, [])

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

  const getRankIcon = (rank: number) => {
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
              <p className="text-white/50 text-xs">Helper #{data.stats?.rank || '-'}</p>
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

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <section
          className={`transition-all duration-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
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
        </section>

        {/* Outbid Alerts */}
        {data.outbidAlerts && data.outbidAlerts.length > 0 && (
          <section
            className={`transition-all duration-500 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h2 className="text-white/70 text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Your Bidders Need Help!
            </h2>
            <div className="space-y-2">
              {data.outbidAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {alert.bidder.name} (Table {alert.bidder.tableNumber})
                    </p>
                    <p className="text-orange-300 text-xs">
                      Outbid on {alert.prize.title} - now {formatCurrency(alert.prize.currentHighestBid)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Leaderboard */}
        <section
          className={`transition-all duration-500 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2 className="text-white/70 text-sm font-medium mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            Helper Leaderboard
          </h2>
          <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
            {data.leaderboard.map((helper, index) => (
              <div
                key={helper.id}
                className={`flex items-center gap-3 p-3 ${
                  index !== data.leaderboard.length - 1 ? 'border-b border-white/10' : ''
                } ${helper.isCurrentHelper ? 'bg-[#b8941f]/10' : ''}`}
              >
                <div className="w-8 flex justify-center">{getRankIcon(helper.rank)}</div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: helper.avatarColor }}
                >
                  {helper.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      helper.isCurrentHelper ? 'text-[#b8941f]' : 'text-white'
                    }`}
                  >
                    {helper.name}
                    {helper.isCurrentHelper && ' (You)'}
                  </p>
                  <p className="text-white/50 text-xs">
                    {helper.totalBids} bids · {helper.uniqueBidders} bidders
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#b8941f] font-semibold text-sm">
                    {formatCurrency(helper.totalValue)}
                  </p>
                  {helper.streak > 0 && (
                    <p className="text-green-400 text-xs flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3" />
                      {helper.streak} streak
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section
          className={`transition-all duration-500 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2 className="text-white/70 text-sm font-medium mb-3">Your Recent Bids</h2>
          {data.recentBids.length === 0 ? (
            <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
              <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No bids yet</p>
              <p className="text-white/30 text-xs">Start helping guests place bids!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentBids.map((bid) => (
                <div
                  key={bid.id}
                  className="bg-white/5 rounded-xl p-3 border border-white/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {bid.prize.title}
                      </p>
                      <p className="text-white/50 text-xs">
                        {bid.bidder.name} · Table {bid.bidder.tableNumber}
                        {bid.isPaperBid && (
                          <span className="ml-2 text-[#b8941f]">Paper bid</span>
                        )}
                      </p>
                    </div>
                    <p className="text-[#b8941f] font-semibold text-sm whitespace-nowrap">
                      {formatCurrency(bid.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0f1d2d] via-[#0f1d2d] to-transparent pt-8 pb-6 px-4">
        <div className="max-w-lg mx-auto">
          <Link
            href="/helper/submit-bid"
            className="block w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-[#b8941f] to-[#d4af37] text-white text-center shadow-lg shadow-[#b8941f]/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Submit New Bid
          </Link>
        </div>
      </div>
    </main>
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
    <div
      className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-white text-2xl font-bold">{value}</p>
      <p className="text-white/50 text-xs">{label}</p>
    </div>
  )
}
