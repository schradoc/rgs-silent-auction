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
}

export function BidSheet({ prize, minimumBid, bidIncrement, onClose }: BidSheetProps) {
  const router = useRouter()
  const [amount, setAmount] = useState(minimumBid.toString())
  const [customAmount, setCustomAmount] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const quickAmounts = [
    minimumBid,
    minimumBid + bidIncrement,
    minimumBid + bidIncrement * 2,
  ]

  const selectedAmount = useCustom ? parseInt(customAmount) || 0 : parseInt(amount)
  const isValidBid = selectedAmount >= minimumBid

  const handleSubmit = async () => {
    if (!isValidBid) {
      setError(`Minimum bid is ${formatCurrency(minimumBid)}`)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Pre-submit validation: re-fetch current prize state to catch outbids
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
          throw new Error(data.error || 'Failed to place bid')
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
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-2xl p-6 animate-slide-up">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bid Placed!</h2>
            <p className="text-gray-600">
              Your bid of {formatCurrency(selectedAmount)} has been submitted.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Place Your Bid</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-600 mb-4 line-clamp-1">{prize.title}</p>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setAmount(amt.toString())
                  setUseCustom(false)
                }}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  !useCustom && parseInt(amount) === amt
                    ? 'border-[#c9a227] bg-[#c9a227]/10 text-[#1e3a5f]'
                    : 'border-gray-200 hover:border-gray-300'
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
              className={`w-full py-3 px-4 rounded-lg border-2 font-medium transition-colors text-left ${
                useCustom
                  ? 'border-[#c9a227] bg-[#c9a227]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Enter custom amount
            </button>

            {useCustom && (
              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    HK$
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={minimumBid.toString()}
                    className="w-full pl-14 pr-4 py-3 border-2 border-gray-200 rounded-lg text-xl font-medium focus:border-[#c9a227] focus:outline-none"
                    min={minimumBid}
                    step={500}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
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
          <Card className="bg-gray-50 mb-4">
            <div className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Your bid</span>
                <span className="text-2xl font-bold text-[#1e3a5f]">
                  {formatCurrency(selectedAmount)}
                </span>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!isValidBid}
          >
            Confirm Bid
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3">
            By placing a bid, you agree to pay this amount if you win.
          </p>
        </div>
      </div>
    </div>
  )
}
