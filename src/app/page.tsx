'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { MapPin, Calendar, ArrowRight, Sparkles, Users, TrendingUp, Clock, Bell, Heart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AuctionStatus {
  isAuctionOpen: boolean
  auctionEndTime: string | null
  auctionStartTime: string | null
  stats: {
    totalPrizes: number
    totalBidders: number
    totalBids: number
    totalRaised: number
  }
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function useCountdown(targetDate: string | null): TimeRemaining | null {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)

  useEffect(() => {
    if (!targetDate) return

    const calculateTime = () => {
      const target = new Date(targetDate).getTime()
      const now = Date.now()
      const diff = target - now

      if (diff <= 0) {
        setTimeRemaining(null)
        return
      }

      setTimeRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return timeRemaining
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<AuctionStatus | null>(null)
  const countdown = useCountdown(status?.auctionStartTime || null)

  useEffect(() => {
    setMounted(true)
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auction-status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (err) {
      console.error('Failed to fetch status:', err)
    }
  }

  const isPreEvent = status && !status.isAuctionOpen && countdown !== null
  const stats = status?.stats || { totalPrizes: 26, totalBidders: 0, totalBids: 0, totalRaised: 0 }

  return (
    <main className="min-h-screen bg-[#0f1d2d] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#b8941f]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#1a3a5c]/50 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b8941f] to-[#8a6f17] flex items-center justify-center shadow-lg shadow-[#b8941f]/20">
              <span className="text-white text-xs font-bold tracking-wide">RGS</span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            {isPreEvent ? (
              <>
                <Clock className="w-3.5 h-3.5 text-[#b8941f]" />
                <span className="text-white/70 text-xs font-medium">Coming Soon</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-white/70 text-xs font-medium">Live Now</span>
              </>
            )}
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          <div className="max-w-2xl w-full text-center">
            {/* Anniversary badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#b8941f]/20 to-[#b8941f]/10 border border-[#b8941f]/30 mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <Sparkles className="w-4 h-4 text-[#b8941f]" />
              <span className="text-[#b8941f] text-sm font-medium">30th Anniversary Gala</span>
            </div>

            {/* Main headline */}
            <h1
              className={`text-5xl md:text-6xl lg:text-7xl font-extralight text-white mb-4 tracking-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              Silent Auction
            </h1>

            <p
              className={`text-xl md:text-2xl text-white/40 font-light mb-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {isPreEvent ? 'Preview prizes now, bid when the gala begins' : 'Extraordinary experiences await'}
            </p>

            {/* Pre-event Countdown */}
            {isPreEvent && countdown && (
              <div
                className={`mb-10 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <p className="text-white/50 text-sm mb-4">Auction opens in</p>
                <div className="flex justify-center gap-4">
                  <CountdownBlock value={countdown.days} label="Days" />
                  <CountdownBlock value={countdown.hours} label="Hours" />
                  <CountdownBlock value={countdown.minutes} label="Min" />
                  <CountdownBlock value={countdown.seconds} label="Sec" />
                </div>
              </div>
            )}

            {/* Live stats - shown when auction is open */}
            {!isPreEvent && (
              <div
                className={`grid grid-cols-3 gap-4 mb-10 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-[#b8941f]" />
                  </div>
                  <p className="text-2xl md:text-3xl font-light text-white">{stats.totalBidders || '—'}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Bidders</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-[#b8941f]" />
                  </div>
                  <p className="text-2xl md:text-3xl font-light text-white">{stats.totalBids || '—'}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Bids Placed</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[#b8941f]" />
                  </div>
                  <p className="text-2xl md:text-3xl font-light text-white">
                    {stats.totalRaised > 0 ? `HK$${Math.floor(stats.totalRaised / 1000)}k` : '—'}
                  </p>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Total Value</p>
                </div>
              </div>
            )}

            {/* Pre-event stats */}
            {isPreEvent && (
              <div
                className={`grid grid-cols-2 gap-4 mb-10 max-w-sm mx-auto transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <p className="text-3xl font-light text-white">{stats.totalPrizes}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Prizes</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <p className="text-3xl font-light text-white">{stats.totalBidders}</p>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Pre-registered</p>
                </div>
              </div>
            )}

            {/* Event details */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 text-white/60 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#b8941f]" />
                <span className="text-sm">28 February 2026</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-white/30" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#b8941f]" />
                <span className="text-sm">Hong Kong Club</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {isPreEvent ? (
                <>
                  <Link href="/prizes">
                    <Button
                      variant="gold"
                      size="lg"
                      className="w-full sm:w-auto min-w-[220px] text-base py-4 shadow-lg shadow-[#b8941f]/25 hover:shadow-xl hover:shadow-[#b8941f]/30 transition-all group"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      <span>Preview Prizes</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto min-w-[220px] text-base py-4 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
                    >
                      <Bell className="w-5 h-5 mr-2" />
                      Get Notified
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/prizes">
                    <Button
                      variant="gold"
                      size="lg"
                      className="w-full sm:w-auto min-w-[220px] text-base py-4 shadow-lg shadow-[#b8941f]/25 hover:shadow-xl hover:shadow-[#b8941f]/30 transition-all group"
                    >
                      <span>Start Bidding</span>
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto min-w-[220px] text-base py-4 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all"
                    >
                      Register Now
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust signals */}
            <p
              className={`mt-10 text-white/30 text-sm transition-all duration-700 delay-600 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            >
              All proceeds support the RGS-HK Schools Outreach Programme
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 flex items-center justify-between text-white/20 text-xs">
          <span>Royal Geographical Society Hong Kong</span>
          <span>Est. 1994</span>
        </footer>
      </div>
    </main>
  )
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 min-w-[70px]">
      <p className="text-3xl md:text-4xl font-light text-white font-mono">
        {String(value).padStart(2, '0')}
      </p>
      <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
    </div>
  )
}
