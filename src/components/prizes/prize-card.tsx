'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { Prize } from '@prisma/client'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop'

interface PrizeCardProps {
  prize: Prize
  isNew?: boolean
}

export function PrizeCard({ prize, isNew }: PrizeCardProps) {
  const hasActiveBid = prize.currentHighestBid > 0
  const [imgSrc, setImgSrc] = useState(prize.imageUrl || FALLBACK_IMAGE)

  return (
    <Link href={`/prizes/${prize.slug}`} className="block group">
      <article className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 ${isNew ? 'ring-2 ring-[#b8941f] ring-offset-2' : 'shadow-sm'}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={imgSrc}
            alt={prize.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            unoptimized
          />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
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
          <h3 className="font-medium text-gray-900 text-base leading-snug mb-1.5 line-clamp-2 group-hover:text-[#1a2f4a] transition-colors">
            {prize.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {prize.shortDescription}
          </p>

          {/* Bid info */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">
                {hasActiveBid ? 'Current Bid' : 'Starting Bid'}
              </p>
              <p className={`text-lg font-semibold tracking-tight ${hasActiveBid ? 'text-[#b8941f]' : 'text-gray-900'}`}>
                {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
              </p>
            </div>

            <span className="text-sm font-medium text-[#1a2f4a] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
              View
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
