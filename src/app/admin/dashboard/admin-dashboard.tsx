'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Gavel,
  Users,
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
  Eye,
  EyeOff,
  TestTube,
  FileEdit,
  Rocket,
  Lock,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Activity,
  HelpCircle,
  ExternalLink,
  Loader2,
  Send,
  UserPlus,
  Shield,
  Monitor,
  MessageSquare,
  LifeBuoy,
  QrCode,
  RotateCw,
  User,
  Key,
} from 'lucide-react'
import { Button, Card, CardContent, Badge, toast, useConfirm, ConfirmProvider } from '@/components/ui'
import { PasswordManagement } from '@/components/admin/password-management'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import { OnboardingTutorial, useOnboarding } from '@/components/admin/onboarding-tutorial'
import { AnalyticsCharts } from '@/components/admin/analytics-charts'
import { ImageUpload } from '@/components/admin/image-upload'

interface PrizeImage {
  id: string
  url: string
  isPrimary: boolean
  order: number
}

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
  images?: PrizeImage[]
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

interface BidderWithHistory extends Bidder {
  bids: Array<{
    id: string
    amount: number
    status: string
    createdAt: Date | string
    prize: {
      id: string
      title: string
      slug: string
    }
  }>
  totalBidAmount: number
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

function AdminDashboardContent({ initialData }: AdminDashboardProps) {
  const confirm = useConfirm()
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

  // Loading states for async operations
  const [savingPrize, setSavingPrize] = useState(false)
  const [deletingPrize, setDeletingPrize] = useState<string | null>(null)
  const [savingHelper, setSavingHelper] = useState(false)
  const [deletingHelper, setDeletingHelper] = useState<string | null>(null)
  const [confirmingAllWinners, setConfirmingAllWinners] = useState(false)

  // Bidder modal state
  const [selectedBidder, setSelectedBidder] = useState<BidderWithHistory | null>(null)
  const [loadingBidder, setLoadingBidder] = useState(false)
  const [loadingBidderId, setLoadingBidderId] = useState<string | null>(null) // Track which bidder row is loading

  // Page visibility for polling optimization
  const [isPageVisible, setIsPageVisible] = useState(true)

  // Prize images state for new prizes
  const [prizeImages, setPrizeImages] = useState<PrizeImage[]>([])

  // Prize detail modal state
  const [selectedPrize, setSelectedPrize] = useState<{
    id: string
    title: string
    shortDescription: string
    currentHighestBid: number
    minimumBid: number
    donorName: string
    category: string
    stats: { totalBids: number; uniqueBidders: number; averageBid: number }
    bids: Array<{
      id: string
      amount: number
      createdAt: string
      status: string
      bidder: { id: string; name: string; tableNumber: string; email: string }
    }>
    winners: Array<{
      id: string
      bidder: { id: string; name: string; tableNumber: string }
      bid: { amount: number }
    }>
  } | null>(null)
  const [loadingPrize, setLoadingPrize] = useState(false)
  const [loadingPrizeId, setLoadingPrizeId] = useState<string | null>(null)

  // Settings page state
  const [settingsSection, setSettingsSection] = useState<'auction' | 'display' | 'account' | 'team' | 'email' | 'export' | 'support'>('auction')
  const [displaySettings, setDisplaySettings] = useState({
    showDonorNames: true,
    showBidderNames: false,
    featuredRotationSecs: 8,
    customQrUrl: '',
  })
  const [adminUsers, setAdminUsers] = useState<Array<{
    id: string
    email: string
    name: string
    role: 'OWNER' | 'ADMIN' | 'EMPLOYEE'
    isActive: boolean
    lastLoginAt: string | null
    createdAt: string
  }>>([])
  const [pendingInvitations, setPendingInvitations] = useState<Array<{
    id: string
    email: string
    role: 'OWNER' | 'ADMIN' | 'EMPLOYEE'
    expiresAt: string
    invitedBy: { name: string; email: string }
  }>>([])
  const [currentUser, setCurrentUser] = useState<{
    id: string
    email: string
    name: string
    role: 'OWNER' | 'ADMIN' | 'EMPLOYEE'
    hasPassword?: boolean
  } | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE')
  const [inviting, setInviting] = useState(false)
  const [savingDisplaySettings, setSavingDisplaySettings] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingSms, setTestingSms] = useState(false)
  const [testingWhatsApp, setTestingWhatsApp] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [smsStatus, setSmsStatus] = useState<{ configured: boolean; phone: string | null } | null>(null)
  const [whatsappStatus, setWhatsappStatus] = useState<{ configured: boolean; phone: string | null } | null>(null)

  // Page visibility tracking for polling optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Poll for updates - reduced frequency when tab is hidden
  useEffect(() => {
    const pollInterval = isPageVisible ? 5000 : 30000 // 5s when visible, 30s when hidden
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
    }, pollInterval)

    return () => clearInterval(interval)
  }, [isPageVisible])

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
        toast.success('Winner confirmed successfully')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to confirm winner')
      }
    } catch (error) {
      console.error('Failed to confirm winner:', error)
      toast.error('Failed to confirm winner')
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
        toast.success('Auction end time updated')
      } else {
        toast.error('Failed to set end time')
      }
    } catch (error) {
      console.error('Failed to set end time:', error)
      toast.error('Failed to set end time')
    }
  }

  useEffect(() => {
    if (activeTab === 'helpers') {
      fetchHelpers()
    }
    if (activeTab === 'winners') {
      fetchWinners()
    }
    if (activeTab === 'settings') {
      fetchSettingsData()
    }
  }, [activeTab])

  const fetchSettingsData = async () => {
    try {
      // Fetch current user
      const userRes = await fetch('/api/admin/users', { credentials: 'include' })
      if (userRes.ok) {
        const userData = await userRes.json()
        setCurrentUser(userData.user)
      }

      // Fetch all users (owners only)
      const allUsersRes = await fetch('/api/admin/users?all=true', { credentials: 'include' })
      if (allUsersRes.ok) {
        const allUsersData = await allUsersRes.json()
        if (allUsersData.users) {
          setAdminUsers(allUsersData.users)
        }
      }

      // Fetch pending invitations
      const invitationsRes = await fetch('/api/admin/invitations', { credentials: 'include' })
      if (invitationsRes.ok) {
        const invitationsData = await invitationsRes.json()
        setPendingInvitations(invitationsData.invitations || [])
      }

      // Fetch display settings
      const settingsRes = await fetch('/api/admin/settings', { credentials: 'include' })
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        if (settingsData.displaySettings) {
          setDisplaySettings({
            showDonorNames: settingsData.displaySettings.showDonorNames ?? true,
            showBidderNames: settingsData.displaySettings.showBidderNames ?? false,
            featuredRotationSecs: settingsData.displaySettings.featuredRotationSecs ?? 8,
            customQrUrl: settingsData.displaySettings.customQrUrl || '',
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings data:', error)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required')
      return
    }

    setInviting(true)
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        credentials: 'include',
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Invitation sent to ${inviteEmail}`)
        setInviteEmail('')
        setShowInviteForm(false)
        fetchSettingsData()
      } else {
        toast.error(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    const confirmed = await confirm.confirm({
      title: 'Revoke Invitation',
      description: 'Are you sure you want to revoke this invitation?',
      confirmLabel: 'Revoke',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admin/invitations?id=${invitationId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Invitation revoked')
        fetchSettingsData()
      } else {
        toast.error('Failed to revoke invitation')
      }
    } catch (error) {
      toast.error('Failed to revoke invitation')
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: 'ADMIN' | 'EMPLOYEE') => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
        credentials: 'include',
      })

      if (res.ok) {
        toast.success('Role updated')
        fetchSettingsData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update role')
      }
    } catch (error) {
      toast.error('Failed to update role')
    }
  }

  const handleToggleUserActive = async (userId: string, isActive: boolean) => {
    const action = isActive ? 'deactivate' : 'reactivate'
    const confirmed = await confirm.confirm({
      title: `${isActive ? 'Deactivate' : 'Reactivate'} User`,
      description: `Are you sure you want to ${action} this user?`,
      confirmLabel: isActive ? 'Deactivate' : 'Reactivate',
      variant: isActive ? 'danger' : 'default',
    })
    if (!confirmed) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, isActive: !isActive }),
        credentials: 'include',
      })

      if (res.ok) {
        toast.success(`User ${action}d`)
        fetchSettingsData()
      } else {
        const data = await res.json()
        toast.error(data.error || `Failed to ${action} user`)
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    }
  }

  const handleSaveDisplaySettings = async () => {
    setSavingDisplaySettings(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(displaySettings),
        credentials: 'include',
      })

      if (res.ok) {
        toast.success('Display settings saved')
      } else {
        toast.error('Failed to save display settings')
      }
    } catch (error) {
      toast.error('Failed to save display settings')
    } finally {
      setSavingDisplaySettings(false)
    }
  }

  const handleSendTestEmail = async () => {
    setTestingEmail(true)
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Test email sent to your address')
      } else {
        toast.error(data.error || 'Failed to send test email')
      }
    } catch (error) {
      toast.error('Failed to send test email')
    } finally {
      setTestingEmail(false)
    }
  }

  // Fetch SMS/WhatsApp status when email section is shown
  useEffect(() => {
    if (settingsSection === 'email') {
      fetch('/api/admin/test-sms', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.status) {
            setSmsStatus(data.status.sms)
            setWhatsappStatus(data.status.whatsapp)
          }
        })
        .catch(() => {
          // Silently fail - will show as not configured
        })
    }
  }, [settingsSection])

  const handleSendTestSms = async (channel: 'sms' | 'whatsapp') => {
    if (!testPhone) {
      toast.error('Please enter a phone number')
      return
    }

    if (channel === 'sms') {
      setTestingSms(true)
    } else {
      setTestingWhatsApp(true)
    }

    try {
      const res = await fetch('/api/admin/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, channel }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.error || `Failed to send test ${channel.toUpperCase()}`)
      }
    } catch (error) {
      toast.error(`Failed to send test ${channel.toUpperCase()}`)
    } finally {
      setTestingSms(false)
      setTestingWhatsApp(false)
    }
  }

  const handleGenerateMockData = async () => {
    const confirmed = await confirm.confirm({
      title: 'Generate Mock Data',
      description: 'This will generate mock bidders and bids for all prizes. Continue?',
      confirmLabel: 'Generate',
    })
    if (!confirmed) return

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
        toast.success(`Created ${data.created.bidders} bidders and ${data.created.bids} bids`)
        handleRefresh()
      } else {
        toast.error(data.error || 'Failed to generate mock data')
      }
    } catch (error) {
      toast.error('Failed to generate mock data')
    } finally {
      setMockDataLoading(false)
    }
  }

  const handleClearMockData = async () => {
    const confirmed = await confirm.confirm({
      title: 'Clear Mock Data',
      description: 'This will delete ALL mock bidders and bids. This cannot be undone.',
      confirmLabel: 'Delete All',
      variant: 'danger',
    })
    if (!confirmed) return

    setMockDataLoading(true)
    try {
      const res = await fetch('/api/admin/mock-data', { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Deleted ${data.deleted.bidders} bidders and ${data.deleted.bids} bids`)
        handleRefresh()
      } else {
        toast.error(data.error || 'Failed to clear mock data')
      }
    } catch (error) {
      toast.error('Failed to clear mock data')
    } finally {
      setMockDataLoading(false)
    }
  }

  const handleStateChange = async (newState: string) => {
    const currentState = data.settings?.auctionState || 'DRAFT'
    const stateConfirmed = await confirm.confirm({
      title: 'Change Auction State',
      description: `Change auction state from ${currentState} to ${newState}?`,
      confirmLabel: 'Change State',
    })
    if (!stateConfirmed) return

    // If closing the auction, ask about auto-confirming winners
    let autoConfirmWinners = false
    if (newState === 'CLOSED') {
      autoConfirmWinners = await confirm.confirm({
        title: 'Auto-confirm Winners?',
        description: 'Would you like to automatically confirm all winners and send notifications? Click Confirm to auto-confirm, or Cancel to just close the auction (you can confirm winners manually later).',
        confirmLabel: 'Auto-confirm Winners',
        cancelLabel: 'Close Only',
      })
    }

    setStateChangeLoading(true)
    try {
      const res = await fetch('/api/admin/auction-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newState, autoConfirmWinners }),
        credentials: 'include',
      })
      const result = await res.json()
      if (res.ok) {
        handleRefresh()
        if (result.winnersConfirmed) {
          toast.success(`Auction closed. ${result.winnersConfirmed} winners confirmed and notified.`)
        } else {
          toast.success(`Auction state changed to ${newState}`)
        }
      } else {
        toast.error(result.error || 'Failed to change state')
      }
    } catch (error) {
      toast.error('Failed to change auction state')
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
    setPrizeImages([])
    setEditingPrize(null)
  }

  const handleEditPrize = async (prize: Prize) => {
    setEditingPrize(prize)
    const prizeData = prize as unknown as {
      shortDescription?: string
      fullDescription?: string
      donorName?: string
      imageUrl?: string
      terms?: string
      validUntil?: string | Date | null
      multiWinnerSlots?: number | null
    }
    // Format date for input[type="date"] if it exists
    let formattedDate = ''
    if (prizeData.validUntil) {
      const date = new Date(prizeData.validUntil)
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0]
      }
    }
    setPrizeForm({
      title: prize.title,
      shortDescription: prizeData.shortDescription || '',
      fullDescription: prizeData.fullDescription || '',
      donorName: prizeData.donorName || '',
      minimumBid: String(prize.minimumBid),
      category: prize.category,
      validUntil: formattedDate,
      imageUrl: prizeData.imageUrl || '',
      terms: prizeData.terms || '',
      multiWinnerEligible: prize.multiWinnerEligible,
      multiWinnerSlots: prizeData.multiWinnerSlots ? String(prizeData.multiWinnerSlots) : '',
    })
    // Load prize images if available
    setPrizeImages(prize.images || [])
    setShowPrizeForm(true)
  }

  const handleSavePrize = async () => {
    setSavingPrize(true)
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
        credentials: 'include',
      })

      const data = await res.json()
      if (res.ok) {
        setShowPrizeForm(false)
        resetPrizeForm()
        handleRefresh()
        toast.success(editingPrize ? 'Prize updated successfully' : 'Prize created successfully')
      } else {
        toast.error(data.error || 'Failed to save prize')
      }
    } catch (error) {
      toast.error('Failed to save prize')
    } finally {
      setSavingPrize(false)
    }
  }

  const handleDeletePrize = async (prizeId: string, permanent = false) => {
    const action = permanent ? 'permanently delete' : 'deactivate'
    const confirmed = await confirm.confirm({
      title: permanent ? 'Permanently Delete Prize' : 'Deactivate Prize',
      description: `Are you sure you want to ${action} this prize?${permanent ? ' This cannot be undone.' : ''}`,
      confirmLabel: permanent ? 'Delete Permanently' : 'Deactivate',
      variant: 'danger',
    })
    if (!confirmed) return

    setDeletingPrize(prizeId)
    try {
      const res = await fetch(`/api/admin/prizes?id=${prizeId}${permanent ? '&permanent=true' : ''}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        handleRefresh()
        toast.success(permanent ? 'Prize deleted' : 'Prize deactivated')
      } else {
        toast.error(data.error || 'Failed to delete prize')
      }
    } catch (error) {
      toast.error('Failed to delete prize')
    } finally {
      setDeletingPrize(null)
    }
  }

  const handleAddHelper = async () => {
    if (!newHelperName || !newHelperPin) return
    setSavingHelper(true)
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
        toast.success('Helper added successfully')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to add helper')
      }
    } catch (error) {
      console.error('Failed to add helper:', error)
      toast.error('Failed to add helper')
    } finally {
      setSavingHelper(false)
    }
  }

  const handleDeleteHelper = async (id: string) => {
    const confirmed = await confirm.confirm({
      title: 'Deactivate Helper',
      description: 'Are you sure you want to deactivate this helper?',
      confirmLabel: 'Deactivate',
      variant: 'danger',
    })
    if (!confirmed) return

    setDeletingHelper(id)
    try {
      const res = await fetch(`/api/admin/helpers?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        fetchHelpers()
        toast.success('Helper deactivated')
      } else {
        toast.error('Failed to deactivate helper')
      }
    } catch (error) {
      console.error('Failed to delete helper:', error)
      toast.error('Failed to deactivate helper')
    } finally {
      setDeletingHelper(null)
    }
  }

  // Fetch prize with full bid history
  const handleViewPrize = async (prizeId: string) => {
    setLoadingPrizeId(prizeId)
    setLoadingPrize(true)
    try {
      const res = await fetch(`/api/admin/prizes/${prizeId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSelectedPrize(data.prize)
      } else {
        toast.error('Failed to load prize details')
      }
    } catch (error) {
      console.error('Failed to fetch prize:', error)
      toast.error('Failed to load prize details')
    } finally {
      setLoadingPrize(false)
      setLoadingPrizeId(null)
    }
  }

  // Fetch bidder with full history
  const handleViewBidder = async (bidderId: string) => {
    setLoadingBidderId(bidderId) // Show loading on the clicked row
    setLoadingBidder(true)
    try {
      const res = await fetch(`/api/admin/bidders/${bidderId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSelectedBidder(data.bidder)
      } else {
        toast.error('Failed to load bidder details')
      }
    } catch (error) {
      console.error('Failed to fetch bidder:', error)
      toast.error('Failed to load bidder details')
    } finally {
      setLoadingBidder(false)
      setLoadingBidderId(null)
    }
  }

  // Bulk confirm all winners
  const handleConfirmAllWinners = async () => {
    const pendingWinners = potentialWinners.filter(w => w.winningBid && !w.isConfirmed)
    if (pendingWinners.length === 0) {
      toast.info('No pending winners to confirm')
      return
    }

    const confirmed = await confirm.confirm({
      title: 'Confirm All Winners',
      description: `Confirm ${pendingWinners.length} winners and send notifications?`,
      confirmLabel: 'Confirm All',
    })
    if (!confirmed) return

    setConfirmingAllWinners(true)
    try {
      const res = await fetch('/api/admin/winners/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendNotifications: true }),
        credentials: 'include',
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(`Confirmed ${result.confirmed} winners`)
        fetchWinners()
      } else {
        toast.error(result.error || 'Failed to confirm winners')
      }
    } catch (error) {
      toast.error('Failed to confirm winners')
    } finally {
      setConfirmingAllWinners(false)
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
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Visit Live Page</span>
            </a>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                      <ImageUpload
                        prizeId={editingPrize?.id}
                        images={prizeImages}
                        onImagesChange={setPrizeImages}
                        maxImages={5}
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
                    <Button variant="outline" onClick={() => { setShowPrizeForm(false); resetPrizeForm(); }} disabled={savingPrize}>
                      Cancel
                    </Button>
                    <Button variant="gold" onClick={handleSavePrize} disabled={savingPrize}>
                      {savingPrize ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingPrize ? 'Update Prize' : 'Create Prize'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {data.prizes.map((prize) => (
                <Card key={prize.id} className={`${!prize.isActive ? 'opacity-50' : ''} hover:shadow-md transition-shadow cursor-pointer`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleViewPrize(prize.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="navy" size="sm">
                            {CATEGORY_LABELS[prize.category as keyof typeof CATEGORY_LABELS]}
                          </Badge>
                          <span className="text-sm text-gray-500">{prize._count.bids} bids</span>
                          {!prize.isActive && (
                            <Badge variant="navy" size="sm" className="bg-red-100 text-red-700">Inactive</Badge>
                          )}
                          {loadingPrizeId === prize.id && (
                            <Loader2 className="w-4 h-4 animate-spin text-[#c9a227]" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900">{prize.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Click to view bid history</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right" onClick={() => handleViewPrize(prize.id)}>
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
                            onClick={(e) => { e.stopPropagation(); handleEditPrize(prize); }}
                            className="text-gray-500 hover:text-gray-700"
                            disabled={deletingPrize === prize.id}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDeletePrize(prize.id); }}
                            className="text-red-500 hover:text-red-700"
                            disabled={deletingPrize === prize.id}
                          >
                            {deletingPrize === prize.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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
                  <button
                    key={bidder.id}
                    onClick={() => handleViewBidder(bidder.id)}
                    className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left relative ${
                      loadingBidderId === bidder.id ? 'bg-gray-50' : ''
                    }`}
                    disabled={loadingBidder}
                  >
                    {/* Loading overlay for clicked row */}
                    {loadingBidderId === bidder.id && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-[#c9a227] animate-spin" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{bidder.name}</p>
                        {bidder.emailVerified && (
                          <Badge variant="navy" size="sm">Verified</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{bidder.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">Table {bidder.tableNumber}</p>
                        <p className="text-sm text-gray-500">{bidder._count.bids} bids</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Bidder History Modal */}
            {selectedBidder && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedBidder.name}</h3>
                      <p className="text-sm text-gray-500">{selectedBidder.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedBidder(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Bidder Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Table Number</p>
                        <p className="font-semibold">{selectedBidder.tableNumber}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Verification</p>
                        <p className="font-semibold flex items-center gap-1">
                          {selectedBidder.emailVerified ? (
                            <>
                              <Check className="w-4 h-4 text-green-500" />
                              Verified
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 text-red-500" />
                              Not verified
                            </>
                          )}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Registered</p>
                        <p className="font-semibold">
                          {new Date(selectedBidder.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Total Bid Amount</p>
                        <p className="font-semibold text-[#c9a227]">
                          {formatCurrency(selectedBidder.totalBidAmount || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Bid History */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Bid History ({selectedBidder.bids?.length || 0})
                      </h4>
                      {selectedBidder.bids?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedBidder.bids.map((bid) => (
                            <div
                              key={bid.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-gray-900">{bid.prize.title}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(bid.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#c9a227]">
                                  {formatCurrency(bid.amount)}
                                </p>
                                <Badge
                                  variant="navy"
                                  size="sm"
                                  className={
                                    bid.status === 'WINNING' || bid.status === 'WON'
                                      ? 'bg-green-100 text-green-700'
                                      : bid.status === 'OUTBID' || bid.status === 'LOST'
                                      ? 'bg-red-100 text-red-700'
                                      : ''
                                  }
                                >
                                  {bid.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No bids yet</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedBidder(null)} className="w-full">
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Prize Detail Modal */}
            {selectedPrize && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPrize(null)}>
                <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b flex items-start justify-between bg-gradient-to-r from-[#1e3a5f] to-[#2d4a6f]">
                    <div>
                      <Badge variant="navy" size="sm" className="mb-2 bg-white/20 text-white">
                        {CATEGORY_LABELS[selectedPrize.category as keyof typeof CATEGORY_LABELS]}
                      </Badge>
                      <h3 className="text-xl font-bold text-white">{selectedPrize.title}</h3>
                      <p className="text-sm text-white/70 mt-1">Donated by {selectedPrize.donorName}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPrize(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 bg-[#c9a227]/10 rounded-xl text-center">
                        <p className="text-2xl font-bold text-[#c9a227]">
                          {formatCurrency(selectedPrize.currentHighestBid || selectedPrize.minimumBid)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedPrize.currentHighestBid > 0 ? 'Current Bid' : 'Minimum Bid'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <p className="text-2xl font-bold text-gray-900">{selectedPrize.stats.totalBids}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Bids</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <p className="text-2xl font-bold text-gray-900">{selectedPrize.stats.uniqueBidders}</p>
                        <p className="text-xs text-gray-500 mt-1">Unique Bidders</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedPrize.stats.averageBid)}</p>
                        <p className="text-xs text-gray-500 mt-1">Avg Bid</p>
                      </div>
                    </div>

                    {/* Winner if exists */}
                    {selectedPrize.winners.length > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-green-800">Winner Confirmed</h4>
                        </div>
                        {selectedPrize.winners.map((winner) => (
                          <div key={winner.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{winner.bidder.name}</p>
                              <p className="text-sm text-gray-500">Table {winner.bidder.tableNumber}</p>
                            </div>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(winner.bid.amount)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bid History */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-[#1e3a5f]" />
                        Bid History ({selectedPrize.bids.length})
                      </h4>
                      {selectedPrize.bids.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Gavel className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No bids yet</p>
                        </div>
                      ) : (
                        <div className="border rounded-xl overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bidder</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Table</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {selectedPrize.bids.map((bid, index) => (
                                <tr key={bid.id} className={index === 0 ? 'bg-[#c9a227]/5' : ''}>
                                  <td className="px-4 py-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      index === 0 ? 'bg-[#c9a227] text-white' :
                                      index === 1 ? 'bg-gray-300 text-gray-700' :
                                      index === 2 ? 'bg-amber-600 text-white' :
                                      'bg-gray-100 text-gray-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900">{bid.bidder.name}</p>
                                    <p className="text-xs text-gray-500">{bid.bidder.email}</p>
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">Table {bid.bidder.tableNumber}</td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`font-bold ${index === 0 ? 'text-[#c9a227]' : 'text-gray-900'}`}>
                                      {formatCurrency(bid.amount)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                                    {new Date(bid.createdAt).toLocaleString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedPrize(null)} className="w-full">
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'winners' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {data.settings?.auctionState === 'CLOSED' ? 'Winner Selection' : 'Currently Winning'}
              </h2>
              <div className="flex gap-2">
                {data.settings?.auctionState === 'CLOSED' && potentialWinners.filter(w => w.winningBid && !w.isConfirmed).length > 0 && (
                  <Button
                    variant="gold"
                    onClick={handleConfirmAllWinners}
                    disabled={confirmingAllWinners}
                  >
                    {confirmingAllWinners ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirm All ({potentialWinners.filter(w => w.winningBid && !w.isConfirmed).length})
                      </>
                    )}
                  </Button>
                )}
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
                      disabled={savingHelper}
                    />
                    <Button variant="gold" onClick={handleAddHelper} disabled={savingHelper}>
                      {savingHelper ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowAddHelper(false); setNewHelperName(''); setNewHelperPin(''); }} disabled={savingHelper}>Cancel</Button>
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
                            disabled={deletingHelper === helper.id}
                          >
                            {deletingHelper === helper.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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
                      toast.success('URL copied to clipboard')
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
          <div className="flex gap-6">
            {/* Settings Navigation Sidebar */}
            <div className="w-48 flex-shrink-0">
              <nav className="space-y-1 sticky top-24">
                {[
                  { id: 'auction', label: 'Auction', icon: Activity },
                  { id: 'display', label: 'Display', icon: Monitor },
                  { id: 'account', label: 'Account', icon: User },
                  { id: 'team', label: 'Team', icon: Users },
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'export', label: 'Data & Export', icon: Download },
                  { id: 'support', label: 'Support', icon: LifeBuoy },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSettingsSection(id as typeof settingsSection)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      settingsSection === id
                        ? 'bg-[#1e3a5f] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 space-y-6">
              {/* Auction Management Section */}
              {settingsSection === 'auction' && (
                <>
                  <h2 className="text-xl font-bold text-gray-900">Auction Management</h2>

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
                              {stateChangeLoading && !isActive ? (
                                <Loader2 className="w-5 h-5 mx-auto mb-1 animate-spin" />
                              ) : (
                                <StateIcon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-white' : ''}`} />
                              )}
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
                </>
              )}

              {/* Display Settings Section */}
              {settingsSection === 'display' && (
                <>
                  <h2 className="text-xl font-bold text-gray-900">Display Settings</h2>

                  <Card>
                    <CardContent className="p-6 space-y-6">
                      {/* Show Donor Names */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Show donor names</h4>
                          <p className="text-sm text-gray-500">Display donor names on the live page and prize cards</p>
                        </div>
                        <button
                          onClick={() => setDisplaySettings({ ...displaySettings, showDonorNames: !displaySettings.showDonorNames })}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            displaySettings.showDonorNames ? 'bg-[#c9a227]' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            displaySettings.showDonorNames ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      {/* Show Bidder Names */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Show bidder names on live display</h4>
                          <p className="text-sm text-gray-500">When off, only table numbers are shown on the live page (admin always sees full names)</p>
                        </div>
                        <button
                          onClick={() => setDisplaySettings({ ...displaySettings, showBidderNames: !displaySettings.showBidderNames })}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            displaySettings.showBidderNames ? 'bg-[#c9a227]' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            displaySettings.showBidderNames ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      {/* Featured Prize Rotation */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Featured prize rotation interval</h4>
                        <p className="text-sm text-gray-500 mb-3">How long each featured prize is shown on the live display</p>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="3"
                            max="30"
                            value={displaySettings.featuredRotationSecs}
                            onChange={(e) => setDisplaySettings({ ...displaySettings, featuredRotationSecs: parseInt(e.target.value) || 8 })}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227] text-center"
                          />
                          <span className="text-gray-500">seconds</span>
                        </div>
                      </div>

                      {/* Custom QR URL */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Custom QR code URL</h4>
                        <p className="text-sm text-gray-500 mb-3">Override the default auction URL for QR codes (leave empty for default)</p>
                        <input
                          type="url"
                          value={displaySettings.customQrUrl}
                          onChange={(e) => setDisplaySettings({ ...displaySettings, customQrUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                        />
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          variant="gold"
                          onClick={handleSaveDisplaySettings}
                          disabled={savingDisplaySettings}
                        >
                          {savingDisplaySettings ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Display Settings'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Live Display URL */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Monitor className="w-5 h-5" />
                        Live Display URL
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
                            toast.success('URL copied to clipboard')
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
                </>
              )}

              {/* Account Section */}
              {settingsSection === 'account' && (
                <>
                  <h2 className="text-xl font-bold text-gray-900">Your Account</h2>

                  {/* Account Info */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xl font-bold">
                          {currentUser?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{currentUser?.name}</h3>
                          <p className="text-sm text-gray-500">{currentUser?.email}</p>
                          <Badge variant="navy" size="sm" className="mt-1">
                            {currentUser?.role}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Password Management */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Password
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {currentUser?.hasPassword
                          ? 'You have a password set. You can sign in with email + password or magic link.'
                          : 'You currently use magic link to sign in. Set a password for faster login.'}
                      </p>
                      <PasswordManagement
                        hasPassword={!!currentUser?.hasPassword}
                        onSuccess={() => {
                          fetchSettingsData()
                        }}
                      />
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Team Management Section */}
              {settingsSection === 'team' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Team Management</h2>
                    {currentUser?.role === 'OWNER' && (
                      <Button variant="gold" onClick={() => setShowInviteForm(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite User
                      </Button>
                    )}
                  </div>

                  {/* Invite Form */}
                  {showInviteForm && (
                    <Card className="border-[#c9a227]">
                      <CardContent className="p-6">
                        <h3 className="font-medium text-gray-900 mb-4">Invite New Admin</h3>
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="colleague@example.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                            />
                          </div>
                          <div className="w-40">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'EMPLOYEE')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                            >
                              <option value="EMPLOYEE">Employee</option>
                              {currentUser?.role === 'OWNER' && <option value="ADMIN">Admin</option>}
                            </select>
                          </div>
                          <Button variant="gold" onClick={handleInviteUser} disabled={inviting}>
                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                          <Button variant="outline" onClick={() => { setShowInviteForm(false); setInviteEmail(''); }}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Admin Users List */}
                  <Card>
                    <div className="p-4 border-b">
                      <h3 className="font-medium text-gray-900">Admin Users ({adminUsers.length})</h3>
                    </div>
                    <div className="divide-y">
                      {adminUsers.map((user) => (
                        <div key={user.id} className={`p-4 flex items-center justify-between ${!user.isActive ? 'opacity-50 bg-gray-50' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              user.role === 'OWNER' ? 'bg-[#c9a227]' : user.role === 'ADMIN' ? 'bg-blue-500' : 'bg-gray-400'
                            }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <Badge variant="navy" size="sm" className={
                                  user.role === 'OWNER' ? 'bg-[#c9a227]/20 text-[#c9a227]' :
                                  user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : ''
                                }>
                                  {user.role}
                                </Badge>
                                {!user.isActive && <Badge variant="navy" size="sm" className="bg-red-100 text-red-700">Inactive</Badge>}
                                {user.id === currentUser?.id && <Badge variant="navy" size="sm" className="bg-green-100 text-green-700">You</Badge>}
                              </div>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          {currentUser?.role === 'OWNER' && user.id !== currentUser.id && user.role !== 'OWNER' && (
                            <div className="flex items-center gap-2">
                              <select
                                value={user.role}
                                onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'ADMIN' | 'EMPLOYEE')}
                                className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                              >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleUserActive(user.id, user.isActive)}
                                className={user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                              >
                                {user.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Pending Invitations */}
                  {pendingInvitations.length > 0 && (
                    <Card>
                      <div className="p-4 border-b">
                        <h3 className="font-medium text-gray-900">Pending Invitations ({pendingInvitations.length})</h3>
                      </div>
                      <div className="divide-y">
                        {pendingInvitations.map((invitation) => (
                          <div key={invitation.id} className="p-4 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{invitation.email}</p>
                                <Badge variant="navy" size="sm">{invitation.role}</Badge>
                              </div>
                              <p className="text-sm text-gray-500">
                                Invited by {invitation.invitedBy.name} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvitation(invitation.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              )}

              {/* Email & Notifications Section */}
              {settingsSection === 'email' && (
                <>
                  <h2 className="text-xl font-bold text-gray-900">Email & Notifications</h2>

                  {/* Email Status */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Email Provider Status
                      </h3>
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-green-700 font-medium">Resend configured and ready</span>
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={handleSendTestEmail}
                          disabled={testingEmail}
                        >
                          {testingEmail ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Test Email
                            </>
                          )}
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          Sends a test email to your admin email address
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Templates Preview */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Email Templates (Preview Only)
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        These are the email templates used by the system. Templates cannot be edited.
                      </p>
                      <div className="space-y-3">
                        {[
                          { name: 'Winner Notification', desc: 'Sent when a bidder wins a prize' },
                          { name: 'Outbid Notification', desc: 'Sent when a bidder is outbid on a prize' },
                          { name: 'Admin Invitation', desc: 'Sent when inviting a new admin user' },
                          { name: 'Magic Link Login', desc: 'Sent for passwordless login' },
                        ].map((template) => (
                          <div key={template.name} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{template.name}</p>
                              <p className="text-sm text-gray-500">{template.desc}</p>
                            </div>
                            <Badge variant="navy" size="sm">System Template</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* SMS/WhatsApp Status */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        SMS & WhatsApp Status
                      </h3>

                      {/* SMS Status */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${smsStatus?.configured ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <div className="flex-1">
                            <span className={smsStatus?.configured ? 'text-green-700 font-medium' : 'text-gray-700'}>
                              {smsStatus?.configured
                                ? `SMS configured (${smsStatus.phone})`
                                : 'SMS not configured'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${whatsappStatus?.configured ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <div className="flex-1">
                            <span className={whatsappStatus?.configured ? 'text-green-700 font-medium' : 'text-gray-700'}>
                              {whatsappStatus?.configured
                                ? `WhatsApp configured (${whatsappStatus.phone})`
                                : 'WhatsApp not configured'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Test SMS/WhatsApp */}
                      {(smsStatus?.configured || whatsappStatus?.configured) && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Send Test Message</h4>
                          <div className="space-y-3">
                            <input
                              type="tel"
                              placeholder="Phone number (e.g., +852 9123 4567)"
                              value={testPhone}
                              onChange={(e) => setTestPhone(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c9a227] focus:border-transparent"
                            />
                            <div className="flex gap-2">
                              {smsStatus?.configured && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleSendTestSms('sms')}
                                  disabled={testingSms || !testPhone}
                                >
                                  {testingSms ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-2" />
                                      Test SMS
                                    </>
                                  )}
                                </Button>
                              )}
                              {whatsappStatus?.configured && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleSendTestSms('whatsapp')}
                                  disabled={testingWhatsApp || !testPhone}
                                >
                                  {testingWhatsApp ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4 mr-2" />
                                      Test WhatsApp
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              For WhatsApp testing, the recipient must have first messaged the Twilio sandbox number.
                            </p>
                          </div>
                        </div>
                      )}

                      {!smsStatus?.configured && !whatsappStatus?.configured && (
                        <p className="text-sm text-gray-500 mt-4">
                          Contact your system administrator to enable SMS and WhatsApp notifications via Twilio.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Data & Export Section */}
              {settingsSection === 'export' && (
                <>
                  <h2 className="text-xl font-bold text-gray-900">Data & Export</h2>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Export Data
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Download auction data as CSV files.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href="/api/admin/export?type=summary"
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Auction Summary
                        </a>
                        <a
                          href="/api/admin/export?type=winners"
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Award className="w-4 h-4" />
                          Winners List
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
                </>
              )}

              {/* Support Section */}
              {settingsSection === 'support' && (
                <>
                  <h2 className="text-xl font-bold text-gray-900">Support</h2>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <LifeBuoy className="w-5 h-5" />
                        Get Help
                      </h3>
                      <div className="space-y-4">
                        <a
                          href="mailto:chris@example.com?subject=RGS Auction Support"
                          className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Mail className="w-5 h-5 text-[#c9a227]" />
                          <div>
                            <p className="font-medium text-gray-900">Contact Support</p>
                            <p className="text-sm text-gray-500">Email the system administrator</p>
                          </div>
                        </a>
                        <a
                          href="/docs"
                          target="_blank"
                          className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <HelpCircle className="w-5 h-5 text-[#c9a227]" />
                          <div>
                            <p className="font-medium text-gray-900">Documentation</p>
                            <p className="text-sm text-gray-500">View guides and FAQs</p>
                          </div>
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-medium text-gray-900 mb-4">System Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Version</span>
                          <span className="font-mono">2.0.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Environment</span>
                          <span className="font-mono">{process.env.NODE_ENV || 'production'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Event</span>
                          <span>RGS-HK 30th Anniversary Gala</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Event Date</span>
                          <span>28 February 2026</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  )
}

// Wrap with ConfirmProvider for confirmation dialogs
export function AdminDashboard(props: AdminDashboardProps) {
  return (
    <ConfirmProvider>
      <AdminDashboardContent {...props} />
    </ConfirmProvider>
  )
}
