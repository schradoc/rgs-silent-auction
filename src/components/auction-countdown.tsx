'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface AuctionCountdownProps {
  endTime: string | null
  isOpen: boolean
  variant?: 'banner' | 'compact' | 'large'
  onAuctionEnd?: () => void
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calculateTimeRemaining(endTime: string): TimeRemaining {
  const target = new Date(endTime).getTime()
  const now = Date.now()
  const total = target - now

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total,
  }
}

export function AuctionCountdown({
  endTime,
  isOpen,
  variant = 'banner',
  onAuctionEnd,
}: AuctionCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [hasEnded, setHasEnded] = useState(false)

  useEffect(() => {
    if (!endTime || !isOpen) return

    const update = () => {
      const remaining = calculateTimeRemaining(endTime)
      setTimeRemaining(remaining)

      if (remaining.total <= 0 && !hasEnded) {
        setHasEnded(true)
        onAuctionEnd?.()
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [endTime, isOpen, hasEnded, onAuctionEnd])

  if (!isOpen) {
    return (
      <div className="bg-gray-800 text-white px-4 py-2 text-center text-sm">
        <span className="text-gray-400">Auction is currently closed</span>
      </div>
    )
  }

  if (!endTime || !timeRemaining) return null

  const isUrgent = timeRemaining.total > 0 && timeRemaining.total < 30 * 60 * 1000 // Less than 30 minutes
  const isCritical = timeRemaining.total > 0 && timeRemaining.total < 10 * 60 * 1000 // Less than 10 minutes

  if (hasEnded || timeRemaining.total <= 0) {
    return (
      <div className="bg-red-600 text-white px-4 py-3 text-center animate-pulse">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Auction Has Ended</span>
        </div>
        <p className="text-sm text-white/80 mt-1">Winners will be announced shortly</p>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isCritical
            ? 'bg-red-500 text-white animate-pulse'
            : isUrgent
            ? 'bg-orange-500 text-white'
            : 'bg-white/10 text-white/70'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>
          {timeRemaining.hours > 0 && `${timeRemaining.hours}h `}
          {timeRemaining.minutes}m {timeRemaining.seconds}s
        </span>
      </div>
    )
  }

  if (variant === 'large') {
    return (
      <div className={`p-6 rounded-2xl ${isCritical ? 'bg-red-500/20 border-2 border-red-500' : isUrgent ? 'bg-orange-500/20 border-2 border-orange-500' : 'bg-white/5 border border-white/10'}`}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className={`w-5 h-5 ${isCritical ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-white/50'}`} />
          <span className={`text-sm font-medium ${isCritical ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-white/50'}`}>
            {isCritical ? 'Hurry! Auction ending soon!' : isUrgent ? 'Auction ending soon' : 'Time remaining'}
          </span>
        </div>
        <div className="flex justify-center gap-4">
          {timeRemaining.days > 0 && (
            <TimeBlock value={timeRemaining.days} label="Days" urgent={isUrgent} critical={isCritical} />
          )}
          <TimeBlock value={timeRemaining.hours} label="Hours" urgent={isUrgent} critical={isCritical} />
          <TimeBlock value={timeRemaining.minutes} label="Min" urgent={isUrgent} critical={isCritical} />
          <TimeBlock value={timeRemaining.seconds} label="Sec" urgent={isUrgent} critical={isCritical} />
        </div>
      </div>
    )
  }

  // Banner variant (default)
  return (
    <div
      className={`px-4 py-2 text-center text-sm ${
        isCritical
          ? 'bg-red-600 text-white animate-pulse'
          : isUrgent
          ? 'bg-orange-500 text-white'
          : 'bg-[#1e3a5f] text-white'
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <Clock className="w-4 h-4" />
        <span>
          {isCritical ? 'ENDING SOON: ' : isUrgent ? 'Closing soon: ' : 'Auction ends in: '}
          {timeRemaining.days > 0 && (
            <span className="font-mono font-semibold">{timeRemaining.days}d </span>
          )}
          <span className="font-mono font-semibold">
            {String(timeRemaining.hours).padStart(2, '0')}:
            {String(timeRemaining.minutes).padStart(2, '0')}:
            {String(timeRemaining.seconds).padStart(2, '0')}
          </span>
        </span>
      </div>
    </div>
  )
}

function TimeBlock({
  value,
  label,
  urgent,
  critical,
}: {
  value: number
  label: string
  urgent: boolean
  critical: boolean
}) {
  return (
    <div
      className={`rounded-xl p-4 min-w-[70px] text-center ${
        critical
          ? 'bg-red-500/30 border border-red-500'
          : urgent
          ? 'bg-orange-500/30 border border-orange-500'
          : 'bg-white/5 border border-white/10'
      }`}
    >
      <p
        className={`text-3xl font-mono font-bold ${
          critical ? 'text-red-400' : urgent ? 'text-orange-400' : 'text-white'
        }`}
      >
        {String(value).padStart(2, '0')}
      </p>
      <p className="text-xs text-white/50 uppercase tracking-wider">{label}</p>
    </div>
  )
}
