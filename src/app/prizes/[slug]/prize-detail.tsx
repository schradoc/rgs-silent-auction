'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { Button, Card, CardContent, Badge } from '@/components/ui'
import { formatCurrency, formatDate, getMinimumNextBid, getMinimumBidIncrement } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import { BidSheet } from './bid-sheet'
import type { Prize, Bid, Bidder } from '@prisma/client'

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

  const hasActiveBid = prize.currentHighestBid > 0
  const minimumNextBid = getMinimumNextBid(prize.currentHighestBid, prize.minimumBid)
  const bidIncrement = getMinimumBidIncrement(prize.currentHighestBid || prize.minimumBid)

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/prizes"
            className="inline-flex items-center text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            All Prizes
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {/* Hero Image */}
        <div className="relative aspect-[16/10]">
          <Image
            src={prize.imageUrl}
            alt={prize.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-4 left-4">
            <Badge variant="navy">{CATEGORY_LABELS[prize.category]}</Badge>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Title & Donor */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{prize.title}</h1>
          <p className="text-gray-600 mb-4">Donated by {prize.donorName}</p>

          {/* Current Bid Card */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {hasActiveBid ? 'Current Highest Bid' : 'Minimum Bid'}
                  </p>
                  <p className={`text-3xl font-bold ${hasActiveBid ? 'text-[#c9a227]' : 'text-[#1e3a5f]'}`}>
                    {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
                  </p>
                  {hasActiveBid && (
                    <p className="text-sm text-gray-500 mt-1">
                      {prize.bids.length} bid{prize.bids.length !== 1 ? 's' : ''} placed
                    </p>
                  )}
                </div>
                <Button variant="gold" size="lg" onClick={() => setShowBidSheet(true)}>
                  Place Bid
                </Button>
              </div>

              {/* Bid increment hint */}
              <p className="text-sm text-gray-400 mt-3">
                Next minimum bid: {formatCurrency(minimumNextBid)} (+{formatCurrency(bidIncrement)} increment)
              </p>
            </CardContent>
          </Card>

          {/* Multi-winner badge */}
          {prize.multiWinnerEligible && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  {prize.multiWinnerSlots
                    ? `${prize.multiWinnerSlots} available`
                    : 'Multiple winners possible'}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="prose prose-gray max-w-none mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About this prize</h2>
            <p className="text-gray-700 whitespace-pre-line">{prize.fullDescription}</p>
          </div>

          {/* Valid Until */}
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <Clock className="w-4 h-4" />
            <span>Valid until {formatDate(prize.validUntil)}</span>
          </div>

          {/* Terms & Conditions */}
          {prize.terms && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-medium text-gray-900">Terms & Conditions</span>
                {showTerms ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {showTerms && (
                <p className="mt-3 text-sm text-gray-600">{prize.terms}</p>
              )}
            </div>
          )}

          {/* Recent Bids */}
          {prize.bids.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Recent Bids</h3>
              <div className="space-y-2">
                {prize.bids.slice(0, 5).map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                      index === 0 ? 'bg-[#c9a227]/10' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-600">
                      Table {bid.bidder.tableNumber}
                      {index === 0 && (
                        <Badge variant="gold" size="sm" className="ml-2">
                          Leading
                        </Badge>
                      )}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(bid.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
