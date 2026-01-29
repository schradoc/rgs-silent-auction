'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Trophy,
  Activity,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Clock,
  DollarSign,
} from 'lucide-react'

interface AnalyticsData {
  hourlyActivity: { hour: string; bids: number; value: number }[]
  topPrizes: { id: string; title: string; currentBid: number; bidCount: number }[]
  categoryBreakdown: { category: string; prizes: number; totalValue: number; bids: number }[]
  bidderStats: { total: number; verified: number; active: number }
  recentActivity: { bidsLastHour: number; valueLastHour: number }
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/analytics', { credentials: 'include' })
      if (res.ok) {
        const result = await res.json()
        setData(result)
        setError(null)
      } else {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData.error || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                <div className="h-8 w-24 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-600 mb-3">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="text-sm text-[#c9a227] hover:underline inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  // Find max bid count for scaling the chart
  const maxBids = Math.max(...data.hourlyActivity.map((h) => h.bids), 1)
  const totalBidsToday = data.hourlyActivity.reduce((sum, h) => sum + h.bids, 0)
  const totalValueToday = data.hourlyActivity.reduce((sum, h) => sum + h.value, 0)

  // Calculate engagement rate
  const engagementRate = data.bidderStats.total > 0
    ? Math.round((data.bidderStats.active / data.bidderStats.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bids Last Hour */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Bids (Last Hour)</p>
                  <p className="text-3xl font-bold text-gray-900">{data.recentActivity.bidsLastHour}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  data.recentActivity.bidsLastHour > 0 ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Zap className={`w-5 h-5 ${data.recentActivity.bidsLastHour > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </div>
            </div>
            <div className={`h-1 ${data.recentActivity.bidsLastHour > 0 ? 'bg-green-500' : 'bg-gray-200'}`} />
          </CardContent>
        </Card>

        {/* Value Last Hour */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Value (Last Hour)</p>
                  <p className="text-3xl font-bold text-[#c9a227]">
                    {formatCurrency(data.recentActivity.valueLastHour)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#c9a227]/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#c9a227]" />
                </div>
              </div>
            </div>
            <div className="h-1 bg-[#c9a227]" />
          </CardContent>
        </Card>

        {/* Active Bidders */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Active Bidders</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900">{data.bidderStats.active}</p>
                    <p className="text-sm text-gray-500">/ {data.bidderStats.total}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="h-1 bg-blue-500" style={{ width: `${engagementRate}%` }} />
          </CardContent>
        </Card>

        {/* Engagement Rate */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Engagement</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900">{engagementRate}%</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      engagementRate >= 50 ? 'bg-green-100 text-green-700' :
                      engagementRate >= 25 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {engagementRate >= 50 ? 'High' : engagementRate >= 25 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="h-1 bg-purple-500" style={{ width: `${engagementRate}%` }} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Bid Activity Chart - Takes 3 columns */}
        <Card className="lg:col-span-3">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#1e3a5f]" />
              <h3 className="font-semibold text-gray-900">Bid Activity (24h)</h3>
            </div>
            <div className="text-sm text-gray-500">
              {totalBidsToday} bids • {formatCurrency(totalValueToday)}
            </div>
          </div>
          <CardContent className="p-4">
            <div className="h-48 flex items-end gap-[3px]">
              {data.hourlyActivity.map((hour, i) => {
                const percentage = Math.max((hour.bids / maxBids) * 100, 0)
                const isRecent = i >= data.hourlyActivity.length - 3
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap">
                        <p className="font-medium">{hour.hour}</p>
                        <p>{hour.bids} bids • {formatCurrency(hour.value)}</p>
                      </div>
                    </div>
                    <div
                      className={`w-full rounded-t-sm transition-all cursor-pointer ${
                        isRecent ? 'bg-[#c9a227] hover:bg-[#d4af37]' : 'bg-[#1e3a5f] hover:bg-[#2d4a6f]'
                      }`}
                      style={{
                        height: `${Math.max(percentage, hour.bids > 0 ? 4 : 1)}%`,
                        minHeight: hour.bids > 0 ? '6px' : '2px',
                      }}
                    />
                    {/* Show label every 6 hours */}
                    {i % 6 === 0 && (
                      <span className="text-[10px] text-gray-400 mt-1.5 whitespace-nowrap">
                        {hour.hour}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-end gap-4 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#1e3a5f]" />
                <span>Earlier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#c9a227]" />
                <span>Recent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Prizes - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <div className="p-4 border-b flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#c9a227]" />
            <h3 className="font-semibold text-gray-900">Top Prizes</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.topPrizes.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No bids yet
                </div>
              ) : (
                data.topPrizes.map((prize, i) => (
                  <div key={prize.id} className="p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-[#c9a227] text-white' :
                      i === 1 ? 'bg-gray-300 text-gray-700' :
                      i === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {prize.title}
                      </p>
                      <p className="text-xs text-gray-500">{prize.bidCount} bids</p>
                    </div>
                    <p className="font-bold text-[#c9a227] text-sm whitespace-nowrap">
                      {formatCurrency(prize.currentBid)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <div className="p-4 border-b flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#1e3a5f]" />
          <h3 className="font-semibold text-gray-900">Category Performance</h3>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.categoryBreakdown.map((cat) => {
              const avgBidPerPrize = cat.prizes > 0 ? Math.round(cat.bids / cat.prizes) : 0
              return (
                <div key={cat.category} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                  <Badge
                    variant="navy"
                    size="sm"
                    className="mb-3 bg-[#1e3a5f]/10 text-[#1e3a5f]"
                  >
                    {CATEGORY_LABELS[cat.category as keyof typeof CATEGORY_LABELS] || cat.category}
                  </Badge>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Total Value</span>
                      <span className="text-sm font-bold text-[#c9a227]">
                        {formatCurrency(cat.totalValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Prizes</span>
                      <span className="text-sm font-semibold text-gray-700">{cat.prizes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Total Bids</span>
                      <span className="text-sm font-semibold text-gray-700">{cat.bids}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Avg/Prize</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          avgBidPerPrize >= 5 ? 'bg-green-100 text-green-700' :
                          avgBidPerPrize >= 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {avgBidPerPrize} bids
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
