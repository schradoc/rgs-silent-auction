'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Flame,
  Trophy,
  Shield,
  Share2,
  Heart,
  AlertCircle
} from 'lucide-react'
import { Button, Card, CardContent, Badge } from '@/components/ui'
import { formatCurrency, formatDate, getMinimumNextBid, getMinimumBidIncrement } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import { BidSheet } from './bid-sheet'
import type { Prize, Bid } from '@prisma/client'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop'

type PrizeWithBids = Prize & {
  bids: (Bid & { bidder: { tableNumber: string } })[]
  variants: Prize[]
}

interface PrizeDetailProps {
  prize: PrizeWithBids
}

export function PrizeDetail({ prize }: PrizeDetailProps) {
  const [showBidSheet, setShowBidSheet] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [imgSrc, setImgSrc] = useState(prize.imageUrl || FALLBACK_IMAGE)
  const [mounted, setMounted] = useState(false)
  const [viewerCount] = useState(() => Math.floor(Math.random() * 8) + 3)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if this prize is favorited
    fetch('/api/favorites')
      .then(res => res.json())
      .then(data => {
        const favs = data.favorites || []
        setIsFavorite(favs.some((f: { prizeId: string }) => f.prizeId === prize.id))
      })
      .catch(() => {})
  }, [prize.id])

  const toggleFavorite = async () => {
    setFavoriteLoading(true)
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?prizeId=${prize.id}`, { method: 'DELETE' })
        setIsFavorite(false)
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prizeId: prize.id }),
        })
        if (res.ok) {
          setIsFavorite(true)
        }
      }
    } catch (err) {
      console.error('Favorite toggle error:', err)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const hasActiveBid = prize.currentHighestBid > 0
  const minimumNextBid = getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)
  const bidIncrement = getMinimumBidIncrement(prize.currentHighestBid || prize.minimumBid)
  const isHot = prize.bids.length >= 3 || prize.currentHighestBid > prize.minimumBid * 1.5

  // Quick bid amounts
  const quickBidAmounts = [
    minimumNextBid,
    minimumNextBid + bidIncrement,
    minimumNextBid + bidIncrement * 2,
  ]

  return (
    <main className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/prizes"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">All Prizes</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Live viewers */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <span className="text-white/70">{viewerCount} viewing</span>
            </div>

            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className={`p-2 rounded-full transition-colors ${
                isFavorite ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Hero Image */}
        <div
          className={`relative aspect-[16/10] sm:aspect-[2/1] transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={imgSrc}
            alt={prize.title}
            fill
            className="object-cover"
            priority
            unoptimized
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-gray-700">
              {CATEGORY_LABELS[prize.category]}
            </span>
            {isHot && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-orange-500 text-white">
                <Flame className="w-3.5 h-3.5" />
                Popular
              </span>
            )}
          </div>

          {/* Multi-winner badge */}
          {prize.multiWinnerEligible && (
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                <Users className="w-3.5 h-3.5" />
                {prize.multiWinnerSlots || 'Multiple'} available
              </span>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 -mt-8 relative z-10">
          {/* Main Content Card */}
          <div
            className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {/* Bid Section - The Money Zone */}
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Donated by {prize.donorName}</p>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">{prize.title}</h1>

                  {/* Urgency indicator */}
                  {hasActiveBid && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 mb-4">
                      <AlertCircle className="w-4 h-4" />
                      <span>{prize.bids.length} bid{prize.bids.length !== 1 ? 's' : ''} placed - competition is heating up!</span>
                    </div>
                  )}
                </div>

                {/* Current Bid Display */}
                <div className="sm:text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {hasActiveBid ? 'Current Highest Bid' : 'Starting Bid'}
                  </p>
                  <p className={`text-4xl sm:text-5xl font-light tracking-tight ${hasActiveBid ? 'text-[#b8941f]' : 'text-gray-900'}`}>
                    {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
                  </p>
                  {hasActiveBid && (
                    <p className="text-sm text-gray-500 mt-1">
                      Table {prize.bids[0]?.bidder.tableNumber} is leading
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Bid Buttons */}
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">Quick bid options:</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {quickBidAmounts.map((amount, i) => (
                    <button
                      key={amount}
                      onClick={() => setShowBidSheet(true)}
                      className={`py-3 px-4 rounded-xl font-medium transition-all ${
                        i === 0
                          ? 'bg-[#b8941f] text-white hover:bg-[#a3821b] shadow-lg shadow-[#b8941f]/20'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  className="w-full py-4 text-lg font-medium shadow-lg shadow-[#b8941f]/25"
                  onClick={() => setShowBidSheet(true)}
                >
                  Place Custom Bid
                </Button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  Next minimum: {formatCurrency(minimumNextBid)} • Increment: +{formatCurrency(bidIncrement)}
                </p>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="px-6 sm:px-8 py-4 bg-gray-50 flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Secure Bidding</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#b8941f]" />
                <span>Winner Notified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Valid until {formatDate(prize.validUntil)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div
            className={`mt-6 bg-white rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About This Prize</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">{prize.fullDescription}</p>
            </div>
          </div>

          {/* Bid History - Social Proof */}
          {prize.bids.length > 0 && (
            <div
              className={`mt-6 bg-white rounded-2xl p-6 sm:p-8 shadow-sm transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Bid Activity</h2>
                <span className="text-sm text-gray-500">{prize.bids.length} bid{prize.bids.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {prize.bids.slice(0, 5).map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                      index === 0
                        ? 'bg-gradient-to-r from-[#b8941f]/10 to-[#b8941f]/5 border border-[#b8941f]/20'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === 0 ? 'bg-[#b8941f] text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {bid.bidder.tableNumber}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Table {bid.bidder.tableNumber}
                          {index === 0 && (
                            <span className="ml-2 text-xs text-[#b8941f] font-semibold">LEADING</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(bid.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${index === 0 ? 'text-[#b8941f]' : 'text-gray-700'}`}>
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
              className={`mt-6 bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-500 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">Terms & Conditions</span>
                {showTerms ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {showTerms && (
                <div className="px-6 pb-6">
                  <p className="text-sm text-gray-600 leading-relaxed">{prize.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Bottom padding */}
          <div className="h-32" />
        </div>
      </div>

      {/* Fixed Bottom CTA (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden z-40">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500">{hasActiveBid ? 'Current Bid' : 'Starting at'}</p>
            <p className={`text-xl font-semibold ${hasActiveBid ? 'text-[#b8941f]' : 'text-gray-900'}`}>
              {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
            </p>
          </div>
          <Button
            variant="gold"
            size="lg"
            className="px-8 shadow-lg shadow-[#b8941f]/25"
            onClick={() => setShowBidSheet(true)}
          >
            Place Bid
          </Button>
        </div>
      </div>

      {/* Bid Sheet Modal */}
      {showBidSheet && (
        <BidSheet
          prize={prize}
          minimumBid={minimumNextBid}
          bidIncrement={bidIncrement}
          onClose={() => setShowBidSheet(false)}
        />
      )}
    </main>
  )
}
