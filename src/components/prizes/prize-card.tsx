'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
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
    <Link href={`/prizes/${prize.slug}`}>
      <Card hoverable className={isNew ? 'animate-pulse-gold' : ''}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-gray-100">
          <Image
            src={imgSrc}
            alt={prize.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            unoptimized
          />
          <div className="absolute top-2 left-2">
            <Badge variant="navy" size="sm">
              {CATEGORY_LABELS[prize.category]}
            </Badge>
          </div>
          {isNew && (
            <div className="absolute top-2 right-2">
              <Badge variant="gold" size="sm">
                NEW BID!
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
            {prize.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {prize.shortDescription}
          </p>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {hasActiveBid ? 'Current Bid' : 'Min. Bid'}
              </p>
              <p className={`text-lg font-bold ${hasActiveBid ? 'text-[#c9a227]' : 'text-[#1e3a5f]'}`}>
                {formatCurrency(hasActiveBid ? prize.currentHighestBid : prize.minimumBid)}
              </p>
            </div>

            <span className="text-sm font-medium text-[#1e3a5f]">
              View &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
