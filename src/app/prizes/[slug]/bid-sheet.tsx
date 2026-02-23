'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, AlertCircle } from 'lucide-react'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency, getMinimumNextBid } from '@/lib/utils'
import type { Prize } from '@prisma/client'

interface BidSheetProps {
  prize: Prize
  minimumBid: number
  bidIncrement: number
  onClose: () => void
  initialAmount?: number
  isPledge?: boolean
  pledgeTierName?: string
}

export function BidSheet({ prize, minimumBid, bidIncrement, onClose, initialAmount, isPledge, pledgeTierName }: BidSheetProps) {
  const router = useRouter()
  const [amount, setAmount] = useState((initialAmount ?? minimumBid).toString())
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const quickAmounts = isPledge
    ? [minimumBid]
    : [minimumBid, minimumBid + bidIncrement, minimumBid + bidIncrement * 2]

  const selectedAmount = isPledge ? minimumBid : (useCustom ? parseInt(customAmount) || 0 : parseInt(amount))
  const isValidBid = selectedAmount >= minimumBid

  const handleSubmit = async () => {
    if (!isValidBid) {
      setError(`Minimum ${isPledge ? 'pledge' : 'bid'} is ${formatCurrency(minimumBid)}`)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Pre-submit validation: re-fetch current prize state to catch outbids (skip for pledges)
      if (!isPledge) {
        const checkRes = await fetch(`/api/prizes?id=${prize.id}`)
        if (checkRes.ok) {
          const checkData = await checkRes.json()
          const currentPrize = checkData.prizes?.[0] || checkData.prize
          if (currentPrize) {
            const freshMinimum = getMinimumNextBid(currentPrize.currentHighestBid, currentPrize.minimumBid)
            if (selectedAmount < freshMinimum) {
              setError(`Someone outbid you while you were deciding! New minimum is ${formatCurrency(freshMinimum)}.`)
              setIsLoading(false)
              return
            }
          }
        }
      }

      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prizeId: prize.id,
          amount: selectedAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Enhanced error for outbid scenario from server
        if (data.code === 'BID_TOO_LOW' && data.minimumBid) {
          setError(`Someone outbid you! New minimum is ${formatCurrency(data.minimumBid)}.`)
        } else {
          throw new Error(data.error || `Failed to place ${isPledge ? 'pledge' : 'bid'}`)
        }
        return
      }

      setSuccess(true)

      // Refresh page after short delay
      setTimeout(() => {
        router.refresh()
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-2xl p-6 animate-slide-up">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#a08a1e] to-[#8a7618] rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-medium text-[#1a1a1a] mb-2 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              {isPledge ? 'Pledge Confirmed!' : 'Bid Placed!'}
            </h2>
            <p className="text-[#6b6b6b] animate-fade-in-up" style={{ animationDelay: '250ms' }}>
              Your {isPledge ? 'pledge' : 'bid'} of <span className="font-medium text-[#a08a1e]">{formatCurrency(selectedAmount)}</span> has been submitted.
            </p>
            <p className="text-sm text-[#6b6b6b]/70 mt-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
              {isPledge ? 'Thank you for your generous support!' : "We'll notify you if you're outbid"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Simplified pledge confirmation
  if (isPledge) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-2xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-medium text-[#1a1a1a]">
              Confirm Your Pledge
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[#6b6b6b]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="bg-[#f8f8f6] rounded-xl p-6 mb-5 text-center">
              {pledgeTierName && (
                <p className="text-sm text-[#6b6b6b] mb-1">{pledgeTierName}</p>
              )}
              <p className="text-3xl font-light text-[#1a1a1a] tracking-tight">
                {formatCurrency(minimumBid)}
              </p>
              <p className="text-sm text-[#6b6b6b] mt-2 line-clamp-1">{prize.title}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              variant="gold"
              size="lg"
              className="w-full py-4 text-base font-medium"
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              Confirm Pledge
            </Button>

            <p className="text-xs text-[#6b6b6b] text-center mt-3">
              By pledging, you agree to donate this amount.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Standard bid sheet
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-medium text-[#1a1a1a]">
            Place Your Bid
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#6b6b6b]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-[#6b6b6b] mb-4 line-clamp-1">{prize.title}</p>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setAmount(amt.toString())
                  setUseCustom(false)
                }}
                className={`py-3 px-4 rounded-xl border font-medium transition-all duration-200 ${
                  !useCustom && parseInt(amount) === amt
                    ? 'border-[#a08a1e] bg-[#a08a1e]/5 text-[#1a1a1a]'
                    : 'border-gray-100 hover:border-gray-200 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {formatCurrency(amt)}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="mb-4">
            <button
              onClick={() => setUseCustom(!useCustom)}
              className={`w-full py-3 px-4 rounded-xl border font-medium transition-colors text-left ${
                useCustom
                  ? 'border-[#a08a1e] bg-[#a08a1e]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              Enter custom amount
            </button>

            {useCustom && (
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6b6b]">
                    HK$
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={minimumBid.toString()}
                    className="w-full pl-14 pr-4 py-3 border border-gray-100 rounded-xl text-xl font-medium focus:border-[#a08a1e] focus:outline-none transition-all duration-200"
                    min={minimumBid}
                    step={500}
                  />
                </div>
                <p className="text-sm text-[#6b6b6b] mt-1">
                  Minimum: {formatCurrency(minimumBid)}
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Summary */}
          <div className="bg-[#f8f8f6] rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-[#6b6b6b]">Your bid</span>
              <span className="text-2xl font-light text-[#1a1a1a]">
                {formatCurrency(selectedAmount)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            variant="gold"
            size="lg"
            className="w-full py-4 text-base font-medium"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!isValidBid}
          >
            Confirm Bid
          </Button>

          <p className="text-xs text-[#6b6b6b] text-center mt-3">
            By placing a bid, you agree to pay this amount if you win.
          </p>
        </div>
      </div>
    </div>
  )
}
