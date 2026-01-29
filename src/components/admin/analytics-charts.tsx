'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import {
  TrendingUp,
  Users,
  Trophy,
  Activity,
  BarChart3,
  RefreshCw,
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
      const res = await fetch('/api/admin/analytics')
      if (res.ok) {
        const result = await res.json()
        setData(result)
        setError(null)
      } else {
        setError('Failed to load analytics')
      }
    } catch {
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
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  // Find max bid count for scaling the chart
  const maxBids = Math.max(...data.hourlyActivity.map((h) => h.bids), 1)

  return (
    <div className="space-y-6">
      {/* Activity Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.recentActivity.bidsLastHour}</p>
                <p className="text-sm text-gray-500">Bids (last hour)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#c9a227]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#c9a227]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.recentActivity.valueLastHour)}
                </p>
                <p className="text-sm text-gray-500">Value (last hour)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.bidderStats.active}/{data.bidderStats.total}
                </p>
                <p className="text-sm text-gray-500">Active Bidders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((data.bidderStats.verified / Math.max(data.bidderStats.total, 1)) * 100)}%
                </p>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bid Activity Chart */}
        <Card>
          <div className="p-4 border-b flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Bid Activity (24h)</h3>
          </div>
          <CardContent className="p-4">
            <div className="h-40 flex items-end gap-1">
              {data.hourlyActivity.map((hour, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-[#1e3a5f] rounded-t transition-all hover:bg-[#c9a227]"
                    style={{
                      height: `${Math.max((hour.bids / maxBids) * 100, 2)}%`,
                      minHeight: hour.bids > 0 ? '8px' : '2px',
                    }}
                    title={`${hour.hour}: ${hour.bids} bids`}
                  />
                  {/* Show label every 4 hours */}
                  {i % 4 === 0 && (
                    <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">
                      {hour.hour}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Prizes */}
        <Card>
          <div className="p-4 border-b flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Top Prizes by Bids</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.topPrizes.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No bids yet
                </div>
              ) : (
                data.topPrizes.map((prize, i) => (
                  <div key={prize.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm line-clamp-1">
                          {prize.title}
                        </p>
                        <p className="text-xs text-gray-500">{prize.bidCount} bids</p>
                      </div>
                    </div>
                    <p className="font-bold text-[#c9a227] text-sm">
                      {formatCurrency(prize.currentBid)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <div className="p-4 border-b flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Category Performance</h3>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="p-3 bg-gray-50 rounded-lg">
                <Badge variant="navy" size="sm" className="mb-2">
                  {CATEGORY_LABELS[cat.category as keyof typeof CATEGORY_LABELS] || cat.category}
                </Badge>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Prizes</span>
                    <span className="font-medium">{cat.prizes}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bids</span>
                    <span className="font-medium">{cat.bids}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Value</span>
                    <span className="font-medium text-[#c9a227]">
                      {formatCurrency(cat.totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
