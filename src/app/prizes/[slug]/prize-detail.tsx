'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Shield,
  Share2,
  Heart,
  AlertCircle,
  Lock,
  Eye,
  Ban,
  Check,
  Hash,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useBidder } from '@/hooks/useBidder'
import { Button, Card, CardContent, Badge, toast } from '@/components/ui'
import { formatCurrency, formatDate, getMinimumNextBid, getMinimumBidIncrement } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'

const BidSheet = dynamic(() => import('./bid-sheet').then(m => m.BidSheet))
import type { Prize, Bid } from '@prisma/client'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop'

type PrizeImage = {
  id: string
  url: string
  alt: string | null
  order: number
  isPrimary: boolean
}

type PrizeWithBids = Prize & {
  bids: (Bid & { bidder: { tableNumber: string | null } })[]
  variants: Prize[]
  images?: PrizeImage[]
}

type PledgeTier = Prize & {
  _count: { bids: number }
}

interface PrizeDetailProps {
  prize: PrizeWithBids
  pledgeTiers?: PledgeTier[] | null
}

type AuctionState = 'DRAFT' | 'TESTING' | 'PRELAUNCH' | 'LIVE' | 'CLOSED'

export function PrizeDetail({ prize, pledgeTiers }: PrizeDetailProps) {
  const { bidder: contextBidder, refreshBidder } = useBidder()
  const [showBidSheet, setShowBidSheet] = useState(false)
  const [quickBidAmount, setQuickBidAmount] = useState<number | null>(null)
  const [showTerms, setShowTerms] = useState(false)
  const [imgSrc, setImgSrc] = useState(prize.imageUrl || FALLBACK_IMAGE)
  const [mounted, setMounted] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null)
  const [auctionLoading, setAuctionLoading] = useState(true)
  const [isAuctionOpen, setIsAuctionOpen] = useState(true)
  const [deepLinkPending, setDeepLinkPending] = useState(false)
  const [selectedPledgeTier, setSelectedPledgeTier] = useState<PledgeTier | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [userTableNumber, setUserTableNumber] = useState<string | null>(null)
  const [showTablePrompt, setShowTablePrompt] = useState(false)
  const [tableInput, setTableInput] = useState('')
  const [savingTable, setSavingTable] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const searchParams = useSearchParams()

  // Build image list: use images array if available, fall back to single imageUrl
  const allImages = (() => {
    const imgs: { url: string; alt: string | null }[] = []
    if (prize.images && prize.images.length > 0) {
      for (const img of prize.images) {
        imgs.push({ url: img.url, alt: img.alt })
      }
    }
    if (imgs.length === 0) {
      imgs.push({ url: prize.imageUrl || FALLBACK_IMAGE, alt: prize.title })
    }
    return imgs
  })()

  const isPledge = prize.category === 'PLEDGES'

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) setHasScrolled(true)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMounted(true)

    // Check for ?bid=true deep link
    if (searchParams.get('bid') === 'true') {
      setDeepLinkPending(true)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Check if this prize is favorited
    fetch('/api/favorites')
      .then(res => res.json())
      .then(data => {
        const favs = data.favorites || []
        setIsFavorite(favs.some((f: { prizeId: string }) => f.prizeId === prize.id))
      })
      .catch(() => {})

    // Check user data for table number prompt — prefer context, fallback to API
    if (contextBidder) {
      setUserTableNumber(contextBidder.tableNumber || null)
      if (!contextBidder.tableNumber) {
        setShowTablePrompt(true)
      }
    } else {
      fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.bidder) {
            setUserTableNumber(data.bidder.tableNumber || null)
            if (!data.bidder.tableNumber) {
              setShowTablePrompt(true)
            }
          }
        })
        .catch(() => {})
    }

    // Check auction state
    fetch('/api/auction-state')
      .then(res => res.json())
      .then(data => {
        setAuctionState(data.state)
        setIsAuctionOpen(data.isOpen)
      })
      .catch(() => {})
      .finally(() => setAuctionLoading(false))

    // Poll auction state every 10s so bidders learn quickly when auction closes
    const stateInterval = setInterval(() => {
      fetch('/api/auction-state')
        .then(res => res.json())
        .then(data => {
          setAuctionState(data.state)
          setIsAuctionOpen(data.isOpen)
        })
        .catch(() => {})
    }, 10000)
    return () => clearInterval(stateInterval)
  }, [prize.id, searchParams, contextBidder])

  const canBid = auctionState === 'LIVE' && isAuctionOpen

  // Auto-open bid sheet when deep link is pending and bidding is allowed
  useEffect(() => {
    if (deepLinkPending && canBid) {
      setShowBidSheet(true)
      setDeepLinkPending(false)
    }
  }, [deepLinkPending, canBid])

  const getAuctionStateMessage = () => {
    switch (auctionState) {
      case 'DRAFT':
      case 'TESTING':
        return { icon: Lock, title: 'Preview Mode', message: 'The auction is being prepared. Bidding will open soon.' }
      case 'PRELAUNCH':
        return { icon: Eye, title: 'Coming Soon', message: 'Browse the prizes! Bidding opens at the event.' }
      case 'CLOSED':
        return { icon: Ban, title: 'Auction Closed', message: 'This auction has ended. Thank you for participating!' }
      default:
        return null
    }
  }

  const toggleFavorite = async () => {
    const previousState = isFavorite
    setIsFavorite(!isFavorite)
    setFavoriteLoading(true)

    try {
      if (previousState) {
        const res = await fetch(`/api/favorites?prizeId=${prize.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to remove favorite')
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prizeId: prize.id }),
        })
        if (!res.ok) throw new Error('Failed to add favorite')
      }
    } catch (err) {
      setIsFavorite(previousState)
      toast.error('Failed to update favorite')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: prize.title,
      text: `Check out "${prize.title}" at the RGS Silent Auction!`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied!')
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast.success('Link copied!')
        } catch {
          toast.error('Failed to share')
        }
      }
    }
  }

  const handleQuickBid = (amount: number) => {
    setQuickBidAmount(amount)
    setShowBidSheet(true)
  }

  const handleOpenBidSheet = () => {
    setQuickBidAmount(null)
    setShowBidSheet(true)
  }

  const handlePledgeTierSelect = (tier: PledgeTier) => {
    if (tier.id === prize.id) {
      // Current tier — open confirmation directly
      setSelectedPledgeTier(tier)
      setQuickBidAmount(tier.minimumBid)
      setShowBidSheet(true)
    } else {
      // Different tier — navigate to that tier's page with ?bid=true
      window.location.href = `/prizes/${tier.slug}?bid=true`
    }
  }

  const handleSaveTable = async () => {
    if (!tableInput.trim()) return
    setSavingTable(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: tableInput.trim() }),
      })
      if (res.ok) {
        setUserTableNumber(tableInput.trim())
        setShowTablePrompt(false)
        toast.success('Table number saved')
        // Refresh bidder context so other pages see the updated table number
        refreshBidder()
      }
    } catch {}
    setSavingTable(false)
  }

  const hasActiveBid = prize.bids.length > 0
  const minimumNextBid = getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)
  const bidIncrement = getMinimumBidIncrement(prize.currentHighestBid || prize.minimumBid)

  // Quick bid amounts (not used for pledges with tier selector)
  const quickBidAmounts = [minimumNextBid, minimumNextBid + bidIncrement, minimumNextBid + bidIncrement * 2]

  // Urgency message
  const getUrgencyMessage = () => {
    if (isPledge) {
      if (prize.bids.length === 0) return 'Be the first to pledge!'
      if (prize.bids.length === 1) return '1 supporter has pledged'
      return `${prize.bids.length} supporters have pledged`
    }
    if (prize.bids.length === 0) return 'Be the first to bid!'
    if (prize.bids.length === 1) return '1 bid placed'
    return `${prize.bids.length} bids placed`
  }

  // Tier label helpers
  const getTierLabel = (tier: PledgeTier) => {
    const labels: Record<number, string> = { 1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Platinum' }
    return labels[tier.tierLevel || 0] || tier.title
  }

  const getTierColor = (tier: PledgeTier, isActive: boolean) => {
    if (!isActive) {
      const colors: Record<number, string> = {
        1: 'border-amber-700/20 bg-amber-700/5',
        2: 'border-gray-300/30 bg-gray-100/50',
        3: 'border-[#a08a1e]/20 bg-[#a08a1e]/5',
        4: 'border-violet-300/30 bg-violet-50/50',
      }
      return colors[tier.tierLevel || 0] || 'border-gray-100 bg-white'
    }
    const colors: Record<number, string> = {
      1: 'border-amber-700 bg-amber-700/10 ring-1 ring-amber-700/20',
      2: 'border-gray-400 bg-gray-50 ring-1 ring-gray-400/20',
      3: 'border-[#a08a1e] bg-[#a08a1e]/10 ring-1 ring-[#a08a1e]/20',
      4: 'border-violet-500 bg-violet-50 ring-1 ring-violet-500/20',
    }
    return colors[tier.tierLevel || 0] || 'border-[#a08a1e] bg-[#a08a1e]/10'
  }

  // Shimmer skeleton for bid area
  const BidAreaSkeleton = () => (
    <div className="mt-6 space-y-3">
      <div className="h-12 rounded-xl animate-shimmer" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-12 rounded-xl animate-shimmer" />
        <div className="h-12 rounded-xl animate-shimmer" />
        <div className="h-12 rounded-xl animate-shimmer" />
      </div>
      <div className="h-14 rounded-xl animate-shimmer" />
    </div>
  )

  return (
    <main className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/prizes"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors px-3 py-2 -ml-2 rounded-lg hover:bg-white/10 min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">All Prizes</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className={`p-2 rounded-full transition-colors ${
                isFavorite ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Hero Image Carousel */}
        <div
          className={`relative aspect-[16/10] sm:aspect-[2/1] transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={allImages[currentImageIndex]?.url || FALLBACK_IMAGE}
            alt={allImages[currentImageIndex]?.alt || prize.title}
            fill
            className="object-cover transition-opacity duration-300"
            priority
            unoptimized
            onError={() => {
              // Replace broken image in the list with fallback
              setImgSrc(FALLBACK_IMAGE)
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-[#6b6b6b]">
              {CATEGORY_LABELS[prize.category]}
            </span>
          </div>

          {/* Multi-winner badge */}
          {prize.multiWinnerEligible && (
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/90 text-white backdrop-blur-sm">
                <Users className="w-3.5 h-3.5" />
                {prize.multiWinnerSlots || 'Multiple'} available
              </span>
            </div>
          )}

          {/* Carousel controls — only show if multiple images */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); setCurrentImageIndex(i => i === 0 ? allImages.length - 1 : i - 1) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setCurrentImageIndex(i => i === allImages.length - 1 ? 0 : i + 1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); setCurrentImageIndex(i) }}
                    className={`rounded-full transition-all ${
                      i === currentImageIndex
                        ? 'w-6 h-2 bg-white'
                        : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-4 sm:px-6 -mt-8 relative z-10">
          {/* Main Content Card */}
          <div
            className={`bg-white rounded-2xl border border-gray-200/60 overflow-hidden transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
          >
            {/* Bid Section */}
            <div className="p-8 sm:p-10 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex-1">
                  <p className="text-sm text-[#6b6b6b] mb-1">Donated by {prize.donorName}</p>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#1a1a1a] mb-4 tracking-tight">{prize.title}</h1>

                  {/* Urgency indicator */}
                  <div className={`flex items-center gap-2 text-sm ${prize.bids.length > 0 ? 'text-[#a08a1e]' : 'text-[#6b6b6b]'} mb-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} style={{ transitionDelay: '400ms' }}>
                    {prize.bids.length > 0 && <AlertCircle className="w-4 h-4" />}
                    <span>{getUrgencyMessage()}</span>
                  </div>
                </div>

                {/* Current Bid Display */}
                <div className="sm:text-right">
                  <p className="text-xs text-[#6b6b6b]/70 uppercase tracking-wider mb-1">
                    {isPledge
                      ? 'Pledge Amount'
                      : hasActiveBid ? 'Current Highest Bid' : 'Starting Bid'}
                  </p>
                  <p className={`text-4xl sm:text-5xl font-semibold tracking-tighter ${hasActiveBid ? 'text-[#a08a1e]' : 'text-[#1a1a1a]'}`}>
                    {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
                  </p>
                  {hasActiveBid && !isPledge && (
                    <p className="text-sm text-[#6b6b6b] mt-1">
                      {prize.bids[0]?.bidder.tableNumber ? `Table ${prize.bids[0].bidder.tableNumber} is leading` : 'Current leader'}
                    </p>
                  )}
                </div>
              </div>

              {/* Table Number Prompt */}
              {showTablePrompt && canBid && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                  <Hash className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-700">Add your table number for easier identification</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="text"
                      value={tableInput}
                      onChange={(e) => setTableInput(e.target.value)}
                      placeholder="e.g. 12"
                      className="w-16 px-2 py-1 text-sm border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={handleSaveTable}
                      disabled={savingTable || !tableInput.trim()}
                      className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingTable ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setShowTablePrompt(false)}
                      className="px-2 py-1 text-xs text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      Later
                    </button>
                  </div>
                </div>
              )}

              {/* Bid Area */}
              <div className="mt-6">
                {auctionLoading ? (
                  <BidAreaSkeleton />
                ) : (
                  <>
                    {/* Auction State Message */}
                    {auctionState && !canBid && (
                      <div className="mb-4 p-4 rounded-xl bg-[#f8f8f6] border border-gray-100">
                        {(() => {
                          const msg = getAuctionStateMessage()
                          if (!msg) return null
                          const Icon = msg.icon
                          return (
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-5 h-5 text-[#6b6b6b]" />
                              </div>
                              <div>
                                <p className="font-medium text-[#1a1a1a]">{msg.title}</p>
                                <p className="text-sm text-[#6b6b6b]">{msg.message}</p>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {canBid ? (
                      <>
                        {/* Pledge Tier Selector */}
                        {isPledge && pledgeTiers && pledgeTiers.length > 0 ? (
                          <div>
                            <p className="text-sm text-[#6b6b6b] mb-3">Select your pledge tier:</p>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              {pledgeTiers.map((tier) => {
                                const isCurrentTier = tier.id === prize.id
                                return (
                                  <button
                                    key={tier.id}
                                    onClick={() => handlePledgeTierSelect(tier)}
                                    className={`p-4 rounded-xl border transition-all duration-200 text-left hover:scale-[1.01] active:scale-[0.99] ${getTierColor(tier, isCurrentTier)}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-[#1a1a1a]">
                                        {getTierLabel(tier)}
                                      </span>
                                      {isCurrentTier && (
                                        <Check className="w-4 h-4 text-[#a08a1e]" />
                                      )}
                                    </div>
                                    <p className="text-lg font-light text-[#1a1a1a] tracking-tight">
                                      {formatCurrency(tier.minimumBid)}
                                    </p>
                                    <p className="text-xs text-[#6b6b6b] mt-1">
                                      {tier._count.bids} {tier._count.bids === 1 ? 'supporter' : 'supporters'}
                                    </p>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : !isPledge ? (
                          /* Standard bid buttons */
                          <>
                            <p className="text-sm text-[#6b6b6b] mb-3">Quick bid options:</p>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {quickBidAmounts.map((amount, i) => (
                                <button
                                  key={amount}
                                  onClick={() => handleQuickBid(amount)}
                                  className={`py-3 px-4 rounded-xl font-medium transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#a08a1e]/30 focus-visible:outline-none ${
                                    i === 0
                                      ? 'bg-[#a08a1e] text-white hover:bg-[#8a7618]'
                                      : 'bg-[#f8f8f6] text-[#1a1a1a] hover:bg-gray-100'
                                  }`}
                                >
                                  {formatCurrency(amount)}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          /* Fallback for pledges without tiers */
                          <div className="mb-4" />
                        )}

                        {!isPledge && (
                          <Button
                            variant="gold"
                            size="lg"
                            className="w-full py-4 text-base font-medium"
                            onClick={handleOpenBidSheet}
                          >
                            Place Bid
                          </Button>
                        )}

                        {!isPledge && (
                          <p className="text-center text-xs text-[#6b6b6b]/70 mt-3">
                            Next minimum: {formatCurrency(minimumNextBid)} · Increment: +{formatCurrency(bidIncrement)}
                          </p>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full py-4 text-base font-medium"
                        disabled
                      >
                        <Lock className="w-5 h-5 mr-2" />
                        Bidding {auctionState === 'CLOSED' ? 'Ended' : 'Not Yet Open'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Trust Signals */}
            <div className="px-8 sm:px-10 py-4 bg-[#f8f8f6] flex items-center justify-center gap-6 text-xs text-[#6b6b6b]">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Secure Bidding</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#a08a1e]" />
                <span>Winner Notified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Valid until {formatDate(prize.validUntil)}</span>
              </div>
            </div>
          </div>

          {/* Scroll hint - fades out after user scrolls (mobile only) */}
          {!hasScrolled && (
            <div className="flex flex-col items-center py-3 animate-bounce opacity-60 sm:hidden">
              <span className="text-xs text-[#6b6b6b] mb-1">More details</span>
              <ChevronDown className="w-4 h-4 text-[#6b6b6b]" />
            </div>
          )}

          {/* Description */}
          <div
            className={`mt-6 bg-white rounded-2xl p-8 sm:p-10 border border-gray-200/60 transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
          >
            <h2 className="text-lg font-medium text-[#1a1a1a] mb-4">About This Prize</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-[#6b6b6b] whitespace-pre-line leading-relaxed">{prize.fullDescription}</p>
            </div>
          </div>

          {/* Bid History */}
          {prize.bids.length > 0 && (
            <div
              className={`mt-6 bg-white rounded-2xl p-8 sm:p-10 border border-gray-200/60 transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-[#1a1a1a]">
                  {isPledge ? 'Pledge Activity' : 'Bid Activity'}
                </h2>
                <span className="text-sm text-[#6b6b6b]">
                  {prize.bids.length} {isPledge ? 'pledge' : 'bid'}{prize.bids.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {prize.bids.slice(0, 5).map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                      index === 0 && !isPledge
                        ? 'bg-[#a08a1e]/5 border border-[#a08a1e]/10'
                        : 'bg-[#f8f8f6]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === 0 && !isPledge ? 'bg-[#a08a1e] text-white' : 'bg-gray-200 text-[#6b6b6b]'
                      }`}>
                        {bid.bidder.tableNumber || '#'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1a1a1a]">
                          {bid.bidder.tableNumber ? `Table ${bid.bidder.tableNumber}` : isPledge ? 'Supporter' : 'Bidder'}
                          {index === 0 && !isPledge && (
                            <span className="ml-2 text-xs text-[#a08a1e] font-medium">LEADING</span>
                          )}
                        </p>
                        <p className="text-xs text-[#6b6b6b]">
                          {new Date(bid.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-medium ${index === 0 && !isPledge ? 'text-[#a08a1e]' : 'text-[#1a1a1a]'}`}>
                      {formatCurrency(bid.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {prize.terms && (
            <div
              className={`mt-6 bg-white rounded-2xl overflow-hidden border border-gray-200/60 transition-all duration-500 delay-[400ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-[#f8f8f6] transition-colors"
              >
                <span className="font-medium text-[#1a1a1a]">Terms & Conditions</span>
                {showTerms ? (
                  <ChevronUp className="w-5 h-5 text-[#6b6b6b]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#6b6b6b]" />
                )}
              </button>
              {showTerms && (
                <div className="px-6 pb-6">
                  <p className="text-sm text-[#6b6b6b] leading-relaxed">{prize.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-32" />
        </div>
      </div>

      {/* Fixed Bottom CTA (Mobile) */}
      {!auctionLoading && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 sm:hidden z-40">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-[#6b6b6b]">
                {isPledge ? 'Pledge from' : hasActiveBid ? 'Current Bid' : 'Starting at'}
              </p>
              <p className={`text-xl font-medium ${hasActiveBid ? 'text-[#a08a1e]' : 'text-[#1a1a1a]'}`}>
                {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
              </p>
            </div>
            {canBid ? (
              <Button
                variant="gold"
                size="lg"
                className="px-8"
                onClick={handleOpenBidSheet}
              >
                {isPledge ? 'Pledge' : 'Place Bid'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="px-6"
                disabled
              >
                <Lock className="w-4 h-4 mr-2" />
                {auctionState === 'CLOSED' ? 'Ended' : 'Coming Soon'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bid Sheet Modal */}
      {showBidSheet && (
        <BidSheet
          prize={isPledge && selectedPledgeTier ? { ...prize, id: selectedPledgeTier.id, minimumBid: selectedPledgeTier.minimumBid } : prize}
          minimumBid={isPledge ? (selectedPledgeTier?.minimumBid || prize.minimumBid) : minimumNextBid}
          bidIncrement={bidIncrement}
          onClose={() => {
            setShowBidSheet(false)
            setQuickBidAmount(null)
            setSelectedPledgeTier(null)
          }}
          initialAmount={quickBidAmount ?? undefined}
          isPledge={isPledge}
          pledgeTierName={selectedPledgeTier ? getTierLabel(selectedPledgeTier) : undefined}
        />
      )}
    </main>
  )
}
