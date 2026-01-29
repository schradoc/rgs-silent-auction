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
  Trophy,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Award,
  Download,
  Check,
  X,
  Mail,
  Printer,
  Play,
  Pause,
  Eye,
  TestTube,
  FileEdit,
  Rocket,
  Lock,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Activity,
  HelpCircle,
  BookOpen,
} from 'lucide-react'
import { Button, Card, CardContent, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import { OnboardingTutorial, useOnboarding } from '@/components/admin/onboarding-tutorial'
import { AnalyticsCharts } from '@/components/admin/analytics-charts'

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
  auctionState?: 'DRAFT' | 'TESTING' | 'PRELAUNCH' | 'LIVE' | 'CLOSED'
}

const AUCTION_STATES = {
  DRAFT: { label: 'Draft', icon: FileEdit, color: 'bg-gray-500', description: 'Building out prizes and testing' },
  TESTING: { label: 'Testing', icon: TestTube, color: 'bg-purple-500', description: 'Testing with real data' },
  PRELAUNCH: { label: 'Pre-launch', icon: Eye, color: 'bg-blue-500', description: 'Public preview, bidding closed' },
  LIVE: { label: 'Live', icon: Rocket, color: 'bg-green-500', description: 'Bidding is open' },
  CLOSED: { label: 'Closed', icon: Lock, color: 'bg-red-500', description: 'Auction ended' },
}

interface Helper {
  id: string
  name: string
  pin: string
  avatarColor: string
  isActive: boolean
  createdAt: Date | string
  _count: { bidsPrompted: number; paperBids: number }
}

interface Stats {
  totalPrizes: number
  totalBidders: number
  totalBids: number
  totalValue: number
}

interface PotentialWinner {
  prizeId: string
  prizeTitle: string
  prizeSlug: string
  minimumBid: number
  currentHighestBid: number
  winningBid: {
    id: string
    amount: number
    bidder: { id: string; name: string; email: string; tableNumber: string }
  } | null
  isConfirmed: boolean
  confirmedWinners: Array<{
    id: string
    bidder: { id: string; name: string; tableNumber: string }
  }>
  multiWinnerEligible: boolean
  multiWinnerSlots: number | null
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
  const [activeTab, setActiveTab] = useState<'overview' | 'prizes' | 'bidders' | 'winners' | 'helpers' | 'settings'>('overview')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { showOnboarding, completeOnboarding, startOnboarding } = useOnboarding()
  const [helpers, setHelpers] = useState<Helper[]>([])
  const [showAddHelper, setShowAddHelper] = useState(false)
  const [newHelperName, setNewHelperName] = useState('')
  const [newHelperPin, setNewHelperPin] = useState('')
  const [potentialWinners, setPotentialWinners] = useState<PotentialWinner[]>([])
  const [confirmingWinner, setConfirmingWinner] = useState<string | null>(null)
  const [auctionEndTime, setAuctionEndTime] = useState('')
  const [mockDataLoading, setMockDataLoading] = useState(false)
  const [stateChangeLoading, setStateChangeLoading] = useState(false)
  const [showPrizeForm, setShowPrizeForm] = useState(false)
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null)
  const [prizeForm, setPrizeForm] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    donorName: '',
    minimumBid: '',
    category: 'EXPERIENCES',
    validUntil: '',
    imageUrl: '',
    terms: '',
    multiWinnerEligible: false,
    multiWinnerSlots: '',
  })

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/data', { credentials: 'include' })
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
      const res = await fetch('/api/admin/data', { credentials: 'include' })
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
        credentials: 'include',
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

  const fetchHelpers = async () => {
    try {
      const res = await fetch('/api/admin/helpers', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setHelpers(data.helpers || [])
      }
    } catch (error) {
      console.error('Failed to fetch helpers:', error)
    }
  }

  const fetchWinners = async () => {
    try {
      const res = await fetch('/api/admin/winners', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPotentialWinners(data.potentialWinners || [])
      }
    } catch (error) {
      console.error('Failed to fetch winners:', error)
    }
  }

  const handleConfirmWinner = async (prizeId: string, bidId: string, bidderId: string, sendNotification: boolean) => {
    setConfirmingWinner(prizeId)
    try {
      const res = await fetch('/api/admin/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId, bidId, bidderId, sendNotification }),
        credentials: 'include',
      })
      if (res.ok) {
        fetchWinners()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to confirm winner')
      }
    } catch (error) {
      console.error('Failed to confirm winner:', error)
    } finally {
      setConfirmingWinner(null)
    }
  }

  const handleSetEndTime = async () => {
    if (!auctionEndTime) return
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionEndTime: new Date(auctionEndTime).toISOString() }),
        credentials: 'include',
      })
      if (res.ok) {
        handleRefresh()
        alert('Auction end time updated!')
      }
    } catch (error) {
      console.error('Failed to set end time:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'helpers') {
      fetchHelpers()
    }
    if (activeTab === 'winners') {
      fetchWinners()
    }
  }, [activeTab])

  const handleGenerateMockData = async () => {
    if (!confirm('This will generate mock bidders and bids for all prizes. Continue?')) return
    setMockDataLoading(true)
    try {
      const res = await fetch('/api/admin/mock-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidderCount: 25, bidsPerPrize: 4 }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Created ${data.created.bidders} bidders and ${data.created.bids} bids`)
        handleRefresh()
      } else {
        alert(data.error || 'Failed to generate mock data')
      }
    } catch (error) {
      alert('Failed to generate mock data')
    } finally {
      setMockDataLoading(false)
    }
  }

  const handleClearMockData = async () => {
    if (!confirm('This will delete ALL mock bidders and bids. This cannot be undone. Continue?')) return
    setMockDataLoading(true)
    try {
      const res = await fetch('/api/admin/mock-data', { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        alert(`Deleted ${data.deleted.bidders} bidders and ${data.deleted.bids} bids`)
        handleRefresh()
      } else {
        alert(data.error || 'Failed to clear mock data')
      }
    } catch (error) {
      alert('Failed to clear mock data')
    } finally {
      setMockDataLoading(false)
    }
  }

  const handleStateChange = async (newState: string) => {
    const currentState = data.settings?.auctionState || 'DRAFT'
    if (!confirm(`Change auction state from ${currentState} to ${newState}?`)) return
    setStateChangeLoading(true)
    try {
      const res = await fetch('/api/admin/auction-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newState }),
        credentials: 'include',
      })
      const result = await res.json()
      if (res.ok) {
        handleRefresh()
      } else {
        alert(result.error || 'Failed to change state')
      }
    } catch (error) {
      alert('Failed to change auction state')
    } finally {
      setStateChangeLoading(false)
    }
  }

  const resetPrizeForm = () => {
    setPrizeForm({
      title: '',
      shortDescription: '',
      fullDescription: '',
      donorName: '',
      minimumBid: '',
      category: 'EXPERIENCES',
      validUntil: '',
      imageUrl: '',
      terms: '',
      multiWinnerEligible: false,
      multiWinnerSlots: '',
    })
    setEditingPrize(null)
  }

  const handleEditPrize = (prize: Prize) => {
    setEditingPrize(prize)
    setPrizeForm({
      title: prize.title,
      shortDescription: (prize as unknown as { shortDescription: string }).shortDescription || '',
      fullDescription: (prize as unknown as { fullDescription: string }).fullDescription || '',
      donorName: (prize as unknown as { donorName: string }).donorName || '',
      minimumBid: String(prize.minimumBid),
      category: prize.category,
      validUntil: '',
      imageUrl: (prize as unknown as { imageUrl: string }).imageUrl || '',
      terms: (prize as unknown as { terms: string }).terms || '',
      multiWinnerEligible: prize.multiWinnerEligible,
      multiWinnerSlots: '',
    })
    setShowPrizeForm(true)
  }

  const handleSavePrize = async () => {
    try {
      const url = '/api/admin/prizes'
      const method = editingPrize ? 'PUT' : 'POST'
      const body = editingPrize
        ? { id: editingPrize.id, ...prizeForm }
        : prizeForm

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (res.ok) {
        setShowPrizeForm(false)
        resetPrizeForm()
        handleRefresh()
      } else {
        alert(data.error || 'Failed to save prize')
      }
    } catch (error) {
      alert('Failed to save prize')
    }
  }

  const handleDeletePrize = async (prizeId: string, permanent = false) => {
    const action = permanent ? 'permanently delete' : 'deactivate'
    if (!confirm(`Are you sure you want to ${action} this prize?`)) return

    try {
      const res = await fetch(`/api/admin/prizes?id=${prizeId}${permanent ? '&permanent=true' : ''}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        handleRefresh()
      } else {
        alert(data.error || 'Failed to delete prize')
      }
    } catch (error) {
      alert('Failed to delete prize')
    }
  }

  const handleAddHelper = async () => {
    if (!newHelperName || !newHelperPin) return
    try {
      const res = await fetch('/api/admin/helpers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHelperName, pin: newHelperPin }),
        credentials: 'include',
      })
      if (res.ok) {
        setNewHelperName('')
        setNewHelperPin('')
        setShowAddHelper(false)
        fetchHelpers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to add helper')
      }
    } catch (error) {
      console.error('Failed to add helper:', error)
    }
  }

  const handleDeleteHelper = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this helper?')) return
    try {
      const res = await fetch(`/api/admin/helpers?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        fetchHelpers()
      }
    } catch (error) {
      console.error('Failed to delete helper:', error)
    }
  }

  return (
    <>
      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <OnboardingTutorial
          onClose={completeOnboarding}
          onTabChange={setActiveTab}
        />
      )}

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
              onClick={startOnboarding}
              className="text-white hover:bg-white/10"
              title="Start tutorial"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
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
              { id: 'winners', label: 'Winners', icon: Award },
              { id: 'helpers', label: 'Helpers', icon: UserCheck },
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
            {/* Auction State Banner */}
            {data.settings && (
              <Card className="overflow-hidden">
                <div className={`p-4 ${AUCTION_STATES[data.settings.auctionState || 'DRAFT'].color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      {(() => {
                        const StateIcon = AUCTION_STATES[data.settings.auctionState || 'DRAFT'].icon
                        return <StateIcon className="w-6 h-6" />
                      })()}
                      <div>
                        <p className="font-semibold text-lg">
                          Auction Status: {AUCTION_STATES[data.settings.auctionState || 'DRAFT'].label}
                        </p>
                        <p className="text-white/80 text-sm">
                          {AUCTION_STATES[data.settings.auctionState || 'DRAFT'].description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('settings')}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      Change State
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Stats - Clickable */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => setActiveTab('prizes')} className="text-left">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{data.stats.totalPrizes}</p>
                          <p className="text-sm text-gray-500">Prizes</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </CardContent>
                </Card>
              </button>

              <button onClick={() => setActiveTab('bidders')} className="text-left">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{data.stats.totalBidders}</p>
                          <p className="text-sm text-gray-500">Bidders</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </CardContent>
                </Card>
              </button>

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

              <button onClick={() => setActiveTab('winners')} className="text-left">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#c9a227]/20 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-[#c9a227]" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.totalValue)}</p>
                          <p className="text-sm text-gray-500">Total Value</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </CardContent>
                </Card>
              </button>
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

            {/* Analytics Section */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Analytics</h2>
              </div>
              <AnalyticsCharts />
            </div>

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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">All Prizes ({data.prizes.length})</h2>
              <Button variant="gold" onClick={() => { resetPrizeForm(); setShowPrizeForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Prize
              </Button>
            </div>

            {/* Prize Form Modal */}
            {showPrizeForm && (
              <Card className="border-2 border-[#c9a227]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">
                    {editingPrize ? 'Edit Prize' : 'Add New Prize'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        value={prizeForm.title}
                        onChange={(e) => setPrizeForm({ ...prizeForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                        placeholder="e.g., Champagne Tasting Experience"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Description *</label>
                      <input
                        type="text"
                        value={prizeForm.shortDescription}
                        onChange={(e) => setPrizeForm({ ...prizeForm, shortDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                        placeholder="Brief description for cards"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Description *</label>
                      <textarea
                        value={prizeForm.fullDescription}
                        onChange={(e) => setPrizeForm({ ...prizeForm, fullDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                        rows={3}
                        placeholder="Detailed description..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name *</label>
                      <input
                        type="text"
                        value={prizeForm.donorName}
                        onChange={(e) => setPrizeForm({ ...prizeForm, donorName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Bid (HKD) *</label>
                      <input
                        type="number"
                        value={prizeForm.minimumBid}
                        onChange={(e) => setPrizeForm({ ...prizeForm, minimumBid: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        value={prizeForm.category}
                        onChange={(e) => setPrizeForm({ ...prizeForm, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                      <input
                        type="date"
                        value={prizeForm.validUntil}
                        onChange={(e) => setPrizeForm({ ...prizeForm, validUntil: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input
                        type="url"
                        value={prizeForm.imageUrl}
                        onChange={(e) => setPrizeForm({ ...prizeForm, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                      <textarea
                        value={prizeForm.terms}
                        onChange={(e) => setPrizeForm({ ...prizeForm, terms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                        rows={2}
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={prizeForm.multiWinnerEligible}
                          onChange={(e) => setPrizeForm({ ...prizeForm, multiWinnerEligible: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-[#c9a227] focus:ring-[#c9a227]"
                        />
                        <span className="text-sm text-gray-700">Multiple winners allowed</span>
                      </label>
                      {prizeForm.multiWinnerEligible && (
                        <input
                          type="number"
                          value={prizeForm.multiWinnerSlots}
                          onChange={(e) => setPrizeForm({ ...prizeForm, multiWinnerSlots: e.target.value })}
                          className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                          placeholder="Slots"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => { setShowPrizeForm(false); resetPrizeForm(); }}>
                      Cancel
                    </Button>
                    <Button variant="gold" onClick={handleSavePrize}>
                      {editingPrize ? 'Update Prize' : 'Create Prize'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {data.prizes.map((prize) => (
                <Card key={prize.id} className={!prize.isActive ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="navy" size="sm">
                            {CATEGORY_LABELS[prize.category as keyof typeof CATEGORY_LABELS]}
                          </Badge>
                          <span className="text-sm text-gray-500">{prize._count.bids} bids</span>
                          {!prize.isActive && (
                            <Badge variant="navy" size="sm" className="bg-red-100 text-red-700">Inactive</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900">{prize.title}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Current Bid</p>
                          <p className={`text-xl font-bold ${prize.currentHighestBid > 0 ? 'text-[#c9a227]' : 'text-gray-400'}`}>
                            {prize.currentHighestBid > 0
                              ? formatCurrency(prize.currentHighestBid)
                              : formatCurrency(prize.minimumBid) + ' (min)'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPrize(prize)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrize(prize.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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

        {activeTab === 'winners' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {data.settings?.auctionState === 'CLOSED' ? 'Winner Selection' : 'Currently Winning'}
              </h2>
              <div className="flex gap-2">
                <a
                  href="/api/admin/export?type=winners"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Winners
                </a>
                <a
                  href="/admin/print-winners"
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Sheets
                </a>
              </div>
            </div>

            {/* Helper text when auction not closed */}
            {data.settings?.auctionState !== 'CLOSED' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-medium">Auction is still {data.settings?.auctionState?.toLowerCase() || 'in progress'}</p>
                    <p className="text-blue-700 text-sm mt-1">
                      The list below shows who is currently in the lead for each prize. Winners will be confirmed when you{' '}
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        close the auction
                      </button>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {potentialWinners.filter(w => w.winningBid).length}
                  </p>
                  <p className="text-sm text-gray-500">Prizes with Bids</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {potentialWinners.filter(w => w.isConfirmed).length}
                  </p>
                  <p className="text-sm text-gray-500">Confirmed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-orange-500">
                    {potentialWinners.filter(w => w.winningBid && !w.isConfirmed).length}
                  </p>
                  <p className="text-sm text-gray-500">Pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Winners List */}
            <Card>
              <div className="divide-y">
                {potentialWinners.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading winners...
                  </div>
                ) : (
                  potentialWinners.map((pw) => (
                    <div key={pw.prizeId} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{pw.prizeTitle}</h3>
                            {pw.isConfirmed && (
                              <Badge variant="navy" size="sm" className="bg-green-100 text-green-700">
                                <Check className="w-3 h-3 mr-1" />
                                Confirmed
                              </Badge>
                            )}
                          </div>

                          {pw.winningBid ? (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {pw.winningBid.bidder.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Table {pw.winningBid.bidder.tableNumber} • {pw.winningBid.bidder.email}
                                  </p>
                                </div>
                                <p className="text-xl font-bold text-[#c9a227]">
                                  {formatCurrency(pw.winningBid.amount)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No bids received</p>
                          )}
                        </div>

                        {pw.winningBid && !pw.isConfirmed && (
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="gold"
                              size="sm"
                              disabled={confirmingWinner === pw.prizeId}
                              onClick={() => handleConfirmWinner(
                                pw.prizeId,
                                pw.winningBid!.id,
                                pw.winningBid!.bidder.id,
                                true
                              )}
                            >
                              {confirmingWinner === pw.prizeId ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Mail className="w-4 h-4 mr-1" />
                                  Confirm & Notify
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={confirmingWinner === pw.prizeId}
                              onClick={() => handleConfirmWinner(
                                pw.prizeId,
                                pw.winningBid!.id,
                                pw.winningBid!.bidder.id,
                                false
                              )}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Confirm Only
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'helpers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Helpers ({helpers.filter(h => h.isActive).length} active)</h2>
              <Button variant="gold" size="sm" onClick={() => setShowAddHelper(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Helper
              </Button>
            </div>

            {showAddHelper && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Add New Helper</h3>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Helper Name"
                      value={newHelperName}
                      onChange={(e) => setNewHelperName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                    />
                    <input
                      type="text"
                      placeholder="4-digit PIN"
                      value={newHelperPin}
                      onChange={(e) => setNewHelperPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227] text-center font-mono"
                    />
                    <Button variant="gold" onClick={handleAddHelper}>Add</Button>
                    <Button variant="outline" onClick={() => { setShowAddHelper(false); setNewHelperName(''); setNewHelperPin(''); }}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <div className="divide-y">
                {helpers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No helpers yet. Add your first helper above.
                  </div>
                ) : (
                  helpers.map((helper) => (
                    <div key={helper.id} className={`p-4 flex items-center justify-between ${!helper.isActive ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: helper.avatarColor }}
                        >
                          {helper.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{helper.name}</p>
                            {!helper.isActive && (
                              <Badge variant="navy" size="sm">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">PIN: {helper.pin}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{helper._count.bidsPrompted} bids</p>
                          <p className="text-sm text-gray-500">{helper._count.paperBids} paper bids</p>
                        </div>
                        {helper.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHelper(helper.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-2">Helper Portal</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Share this URL with your helpers. They can log in with their 4-digit PIN.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono">
                    {typeof window !== 'undefined' ? `${window.location.origin}/helper` : '/helper'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/helper`)
                      alert('URL copied!')
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Auction Settings</h2>

            {/* Auction State Machine */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Auction State
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Control the auction lifecycle. Each state determines what users can see and do.
                </p>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Object.entries(AUCTION_STATES).map(([state, config]) => {
                    const isActive = (data.settings?.auctionState || 'DRAFT') === state
                    const StateIcon = config.icon
                    return (
                      <button
                        key={state}
                        onClick={() => handleStateChange(state)}
                        disabled={stateChangeLoading || isActive}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          isActive
                            ? `${config.color} border-transparent text-white`
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                        } disabled:opacity-50`}
                      >
                        <StateIcon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-white' : ''}`} />
                        <p className="text-xs font-medium">{config.label}</p>
                      </button>
                    )
                  })}
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Current:</strong> {AUCTION_STATES[data.settings?.auctionState || 'DRAFT'].label} — {AUCTION_STATES[data.settings?.auctionState || 'DRAFT'].description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Auction End Time */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Auction End Time
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Set when the auction will close. A countdown will be shown to bidders.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="datetime-local"
                    value={auctionEndTime}
                    onChange={(e) => setAuctionEndTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                  />
                  <Button variant="gold" onClick={handleSetEndTime} disabled={!auctionEndTime}>
                    Set End Time
                  </Button>
                </div>
                {data.settings?.auctionEndTime && (
                  <p className="text-sm text-gray-500 mt-2">
                    Current end time: {new Date(data.settings.auctionEndTime).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Mock Data - Only show in DRAFT or TESTING state */}
            {(data.settings?.auctionState === 'DRAFT' || data.settings?.auctionState === 'TESTING' || !data.settings?.auctionState) && (
              <Card className="border-purple-200">
                <CardContent className="p-6">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Test Data
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Generate mock bidders and bids to test the platform. Only available in Draft/Testing mode.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleGenerateMockData}
                      disabled={mockDataLoading}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      {mockDataLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Generate Mock Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearMockData}
                      disabled={mockDataLoading}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      {mockDataLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Clear Mock Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Data */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Data
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Download auction data as CSV files.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <a
                    href="/api/admin/export?type=summary"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Summary
                  </a>
                  <a
                    href="/api/admin/export?type=winners"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    Winners
                  </a>
                  <a
                    href="/api/admin/export?type=bids"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Gavel className="w-4 h-4" />
                    All Bids
                  </a>
                  <a
                    href="/api/admin/export?type=bidders"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    All Bidders
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Live Display */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Display
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Show this URL on a projector during the event.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono">
                    {typeof window !== 'undefined' ? `${window.location.origin}/live` : '/live'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/live`)
                      alert('URL copied!')
                    }}
                  >
                    Copy
                  </Button>
                  <a href="/live" target="_blank">
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
    </>
  )
}
