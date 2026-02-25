'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { Prize } from '@prisma/client'

const FALLBACK_IMAGE = '' // No default image - show placeholder

type PrizeWithCount = Prize & { _count?: { bids: number } }

interface PrizeCardProps {
  prize: PrizeWithCount
  isNew?: boolean
}

export function PrizeCard({ prize, isNew }: PrizeCardProps) {
  const hasActiveBid = prize.currentHighestBid > 0
  const [imgSrc, setImgSrc] = useState(prize.imageUrl || '')
  const bidCount = prize._count?.bids ?? 0

  // Build lot number display string
  const lotLabel = prize.lotNumber
    ? `Lot ${prize.lotNumber}${prize.subLotLetter ? `.${prize.subLotLetter}` : ''}`
    : null

  return (
    <Link href={`/prizes/${prize.slug}`} className="block group">
      <article className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-[#c9a227] ${isNew ? 'ring-2 ring-[#b8941f] ring-offset-2' : 'shadow-sm'}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={prize.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgSrc('')}
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] flex items-center justify-center">
              <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
          )}

          {/* Lot number badge (top-left) */}
          {lotLabel && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0f1d2d]/85 backdrop-blur-sm text-white tracking-wide uppercase">
                {lotLabel}
              </span>
            </div>
          )}

          {/* Category badge (below lot number or top-left if no lot) */}
          <div className={`absolute left-3 ${lotLabel ? 'top-11' : 'top-3'}`}>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
              {CATEGORY_LABELS[prize.category]}
            </span>
          </div>

          {/* New bid indicator */}
          {isNew && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#b8941f] text-white shadow-sm animate-pulse-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                New Bid
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-medium text-gray-900 text-base leading-snug mb-1 line-clamp-2 group-hover:text-[#1a2f4a] transition-colors">
            {prize.title}
          </h3>

          {/* Donor name */}
          {prize.donorName && (
            <p className="text-xs text-[#9b9b9b] mb-3">
              Donated by {prize.donorName}
            </p>
          )}

          {/* Quick stats row */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">
                {hasActiveBid ? 'Current Bid' : 'Starting Bid'}
              </p>
              <p className={`text-lg font-semibold tracking-tight ${hasActiveBid ? 'text-[#c9a227]' : 'text-gray-900'}`}>
                {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
              </p>
            </div>

            <p className="text-xs text-[#9b9b9b] font-medium pb-0.5">
              {bidCount > 0
                ? `${bidCount} ${bidCount === 1 ? 'bid' : 'bids'}`
                : 'No bids yet'}
            </p>
          </div>
        </div>
      </article>
    </Link>
  )
}
