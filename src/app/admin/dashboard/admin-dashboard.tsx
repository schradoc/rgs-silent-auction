'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Gavel,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  RefreshCw,
  DollarSign,
  Clock,
  Trophy
} from 'lucide-react'
import { Button, Card, CardContent, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'

interface Prize {
  id: string
  title: string
  slug: string
  category: string
  minimumBid: number
  currentHighestBid: number
  multiWinnerEligible: boolean
  isActive: boolean
  _count: { bids: number }
}

interface Bidder {
  id: string
  name: string
  email: string
  tableNumber: string
  emailVerified: boolean
  createdAt: Date | string
  _count: { bids: number }
}

interface Bid {
  id: string
  amount: number
  createdAt: Date | string
  bidder: { name: string; tableNumber: string }
  prize: { title: string; slug: string }
}

interface Settings {
  isAuctionOpen: boolean
  auctionEndTime: Date | string | null
}

interface Stats {
  totalPrizes: number
  totalBidders: number
  totalBids: number
  totalValue: number
}

interface AdminDashboardProps {
  initialData: {
    prizes: Prize[]
    bidders: Bidder[]
    recentBids: Bid[]
    settings: Settings | null
    stats: Stats
  }
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [data, setData] = useState(initialData)
  const [activeTab, setActiveTab] = useState<'overview' | 'prizes' | 'bidders' | 'settings'>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/data')
        if (res.ok) {
          const newData = await res.json()
          setData(newData)
        }
      } catch (error) {
        console.error('Failed to refresh data:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/admin/data')
      if (res.ok) {
        const newData = await res.json()
        setData(newData)
      }
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleToggleAuction = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAuctionOpen: !data.settings?.isAuctionOpen }),
      })
      if (res.ok) {
        handleRefresh()
      }
    } catch (error) {
      console.error('Failed to toggle auction:', error)
    }
  }

  const formatTime = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold">RGS-HK Admin</h1>
              <p className="text-sm text-white/60">Silent Auction Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/api/admin/logout">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'prizes', label: 'Prizes', icon: Trophy },
              { id: 'bidders', label: 'Bidders', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'text-white border-b-2 border-[#c9a227]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{data.stats.totalPrizes}</p>
                      <p className="text-sm text-gray-500">Prizes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{data.stats.totalBidders}</p>
                      <p className="text-sm text-gray-500">Bidders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Gavel className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{data.stats.totalBids}</p>
                      <p className="text-sm text-gray-500">Bids</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#c9a227]/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[#c9a227]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.totalValue)}</p>
                      <p className="text-sm text-gray-500">Total Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Auction Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${data.settings?.isAuctionOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="font-medium">
                      Auction is {data.settings?.isAuctionOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                  <Button
                    variant={data.settings?.isAuctionOpen ? 'outline' : 'gold'}
                    size="sm"
                    onClick={handleToggleAuction}
                  >
                    {data.settings?.isAuctionOpen ? 'Close Auction' : 'Open Auction'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Bid Feed */}
            <Card>
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <h2 className="font-semibold">Live Bid Feed</h2>
                </div>
              </div>
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {data.recentBids.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No bids yet. Waiting for activity...
                  </div>
                ) : (
                  data.recentBids.map((bid) => (
                    <div key={bid.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {bid.bidder.name} (Table {bid.bidder.tableNumber})
                          </p>
                          <p className="text-sm text-gray-500">{bid.prize.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#c9a227]">{formatCurrency(bid.amount)}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {formatTime(bid.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'prizes' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">All Prizes</h2>
            <div className="grid gap-4">
              {data.prizes.map((prize) => (
                <Card key={prize.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="navy" size="sm">
                            {CATEGORY_LABELS[prize.category as keyof typeof CATEGORY_LABELS]}
                          </Badge>
                          <span className="text-sm text-gray-500">{prize._count.bids} bids</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{prize.title}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Current Bid</p>
                        <p className={`text-xl font-bold ${prize.currentHighestBid > 0 ? 'text-[#c9a227]' : 'text-gray-400'}`}>
                          {prize.currentHighestBid > 0
                            ? formatCurrency(prize.currentHighestBid)
                            : formatCurrency(prize.minimumBid) + ' (min)'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bidders' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Registered Bidders ({data.bidders.length})</h2>
            <Card>
              <div className="divide-y">
                {data.bidders.map((bidder) => (
                  <div key={bidder.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{bidder.name}</p>
                        {bidder.emailVerified && (
                          <Badge variant="navy" size="sm">Verified</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{bidder.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Table {bidder.tableNumber}</p>
                      <p className="text-sm text-gray-500">{bidder._count.bids} bids</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Auction Settings</h2>

            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Auction Status</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Control whether bidding is currently open or closed.
                  </p>
                  <Button
                    variant={data.settings?.isAuctionOpen ? 'outline' : 'gold'}
                    onClick={handleToggleAuction}
                  >
                    {data.settings?.isAuctionOpen ? 'Close Auction' : 'Open Auction'}
                  </Button>
                </div>

                <hr />

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Export Data</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Download all bids and bidder information as CSV.
                  </p>
                  <div className="flex gap-2">
                    <a
                      href="/api/admin/export/bids"
                      download
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Export Bids
                    </a>
                    <a
                      href="/api/admin/export/bidders"
                      download
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Export Bidders
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
