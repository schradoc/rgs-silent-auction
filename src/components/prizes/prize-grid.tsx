'use client'

import { useState } from 'react'
import { PrizeCard } from './prize-card'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { Prize, Category } from '@prisma/client'

interface PrizeGridProps {
  prizes: Prize[]
  recentlyUpdated?: string[] // Prize IDs that were recently updated
}

export function PrizeGrid({ prizes, recentlyUpdated = [] }: PrizeGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL')

  const categories = Object.keys(CATEGORY_LABELS) as Category[]

  const filteredPrizes = selectedCategory === 'ALL'
    ? prizes
    : prizes.filter((p) => p.category === selectedCategory)

  // Group maps together for special display
  const mapPrizes = filteredPrizes.filter((p) => p.category === 'HISTORIC_ITEMS' && p.parentPrizeId === null)
  const otherPrizes = filteredPrizes.filter((p) => p.category !== 'HISTORIC_ITEMS' || p.parentPrizeId !== null)

  return (
    <div>
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'ALL'
              ? 'bg-[#1e3a5f] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Prizes
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-[#1e3a5f] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* Prize Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrizes.map((prize) => (
          <PrizeCard
            key={prize.id}
            prize={prize}
            isNew={recentlyUpdated.includes(prize.id)}
          />
        ))}
      </div>

      {filteredPrizes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No prizes in this category yet.</p>
        </div>
      )}
    </div>
  )
}
