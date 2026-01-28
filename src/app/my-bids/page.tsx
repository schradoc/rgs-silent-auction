'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Trophy,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop'

interface BidWithPrize {
  id: string
  amount: number
  status: 'WINNING' | 'OUTBID' | 'WON' | 'LOST'
  createdAt: string
  prize: {
    id: string
    title: string
    slug: string
    imageUrl: string
    currentHighestBid: number
  }
}

export default function MyBidsPage() {
  const [bids, setBids] = useState<BidWithPrize[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchMyBids()
  }, [])

  const fetchMyBids = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/my-bids')
      if (res.ok) {
        const data = await res.json()
        setBids(data.bids || [])
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error)
    } finally {
      setLoading(false)
    }
  }

  // Stats
  const stats = {
    winning: bids.filter(b => b.status === 'WINNING').length,
    outbid: bids.filter(b => b.status === 'OUTBID').length,
    totalBids: bids.length,
    potentialSpend: bids.filter(b => b.status === 'WINNING').reduce((sum, b) => sum + b.amount, 0),
  }

  return (
    <main className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="bg-[#0f1d2d] text-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/prizes"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Browse Prizes</span>
          </Link>

          <button
            onClick={fetchMyBids}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f1d2d] to-[#1a2f4a] text-white py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div
            className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <h1 className="text-3xl font-light tracking-tight mb-2">My Bids</h1>
            <p className="text-white/50">Track your auction activity</p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-3xl mx-auto px-4 -mt-6">
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.winning}</p>
            <p className="text-xs text-gray-500">Winning</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.outbid}</p>
            <p className="text-xs text-gray-500">Outbid</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalBids}</p>
            <p className="text-xs text-gray-500">Total Bids</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#b8941f]/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#b8941f]" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#b8941f]">{formatCurrency(stats.potentialSpend)}</p>
            <p className="text-xs text-gray-500">If You Win All</p>
          </div>
        </div>
      </section>

      {/* Bids List */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bids.length === 0 ? (
          <div
            className={`text-center py-16 transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No bids yet</h2>
            <p className="text-gray-500 mb-6">Start bidding on prizes to see them here</p>
            <Link href="/prizes">
              <Button variant="gold">Browse Prizes</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Winning bids first, then outbid */}
            {[...bids]
              .sort((a, b) => {
                if (a.status === 'WINNING' && b.status !== 'WINNING') return -1
                if (a.status !== 'WINNING' && b.status === 'WINNING') return 1
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              })
              .map((bid, index) => (
                <BidCard key={bid.id} bid={bid} index={index} mounted={mounted} />
              ))}
          </div>
        )}
      </section>
    </main>
  )
}

function BidCard({ bid, index, mounted }: { bid: BidWithPrize; index: number; mounted: boolean }) {
  const [imgSrc, setImgSrc] = useState(bid.prize.imageUrl || FALLBACK_IMAGE)
  const isWinning = bid.status === 'WINNING'
  const isOutbid = bid.status === 'OUTBID'

  return (
    <Link
      href={`/prizes/${bid.prize.slug}`}
      className={`block transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${200 + index * 50}ms` }}
    >
      <div className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
        isWinning ? 'ring-2 ring-green-500 ring-offset-2' : ''
      } ${isOutbid ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}>
        <div className="flex">
          {/* Image */}
          <div className="relative w-24 sm:w-32 aspect-square flex-shrink-0">
            <Image
              src={imgSrc}
              alt={bid.prize.title}
              fill
              className="object-cover"
              onError={() => setImgSrc(FALLBACK_IMAGE)}
              unoptimized
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{bid.prize.title}</h3>
                {isWinning && (
                  <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <Trophy className="w-3 h-3" />
                    Winning
                  </span>
                )}
                {isOutbid && (
                  <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    <AlertTriangle className="w-3 h-3" />
                    Outbid
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Your bid: {formatCurrency(bid.amount)}
              </p>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-xs text-gray-400">Current highest</p>
                <p className={`text-sm font-semibold ${isWinning ? 'text-green-600' : 'text-[#b8941f]'}`}>
                  {formatCurrency(bid.prize.currentHighestBid)}
                </p>
              </div>

              {isOutbid && (
                <Button variant="gold" size="sm" className="text-xs">
                  Raise Bid
                </Button>
              )}

              {isWinning && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  You&apos;re in the lead!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Outbid warning banner */}
        {isOutbid && (
          <div className="bg-orange-50 px-4 py-2 flex items-center justify-between border-t border-orange-100">
            <p className="text-xs text-orange-700">
              Someone outbid you! Raise your bid to stay in the running.
            </p>
            <ChevronRight className="w-4 h-4 text-orange-400" />
          </div>
        )}
      </div>
    </Link>
  )
}
