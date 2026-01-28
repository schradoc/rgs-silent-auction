'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Heart,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop'

interface Favorite {
  id: string
  prizeId: string
  createdAt: string
  prize: {
    id: string
    slug: string
    title: string
    shortDescription: string
    imageUrl: string
    minimumBid: number
    currentHighestBid: number
    category: string
  }
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites')
      if (res.ok) {
        const data = await res.json()
        setFavorites(data.favorites || [])
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (prizeId: string) => {
    try {
      const res = await fetch(`/api/favorites?prizeId=${prizeId}`, { method: 'DELETE' })
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.prizeId !== prizeId))
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    }
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
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f1d2d] to-[#1a2f4a] text-white py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div
            className={`transition-all duration-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-red-400" fill="#f87171" />
              <h1 className="text-3xl font-light tracking-tight">My Favorites</h1>
            </div>
            <p className="text-white/50">Prizes you're watching</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div
            className={`text-center py-16 transition-all duration-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-gray-500 mb-6">Browse prizes and tap the heart to save them here</p>
            <Link href="/prizes">
              <Button variant="gold">Browse Prizes</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((fav, index) => (
              <FavoriteCard
                key={fav.id}
                favorite={fav}
                onRemove={handleRemove}
                index={index}
                mounted={mounted}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function FavoriteCard({
  favorite,
  onRemove,
  index,
  mounted,
}: {
  favorite: Favorite
  onRemove: (prizeId: string) => void
  index: number
  mounted: boolean
}) {
  const [imgSrc, setImgSrc] = useState(favorite.prize.imageUrl || FALLBACK_IMAGE)

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <Link href={`/prizes/${favorite.prize.slug}`} className="flex">
        <div className="relative w-28 sm:w-36 aspect-square flex-shrink-0">
          <Image
            src={imgSrc}
            alt={favorite.prize.title}
            fill
            className="object-cover"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            unoptimized
          />
        </div>

        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
              {favorite.prize.title}
            </h3>
            <p className="text-gray-500 text-xs line-clamp-1">
              {favorite.prize.shortDescription}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-gray-400">Current bid</p>
              <p className="text-[#b8941f] font-semibold">
                {favorite.prize.currentHighestBid > 0
                  ? formatCurrency(favorite.prize.currentHighestBid)
                  : formatCurrency(favorite.prize.minimumBid) + ' (min)'}
              </p>
            </div>

            <Link
              href={`/prizes/${favorite.prize.slug}`}
              className="px-3 py-1.5 bg-[#b8941f] text-white text-xs font-medium rounded-lg hover:bg-[#a07f1a] transition-colors flex items-center gap-1"
            >
              <TrendingUp className="w-3 h-3" />
              Bid Now
            </Link>
          </div>
        </div>
      </Link>

      {/* Remove Button */}
      <div className="px-4 pb-3">
        <button
          onClick={() => onRemove(favorite.prizeId)}
          className="w-full py-2 text-red-500 text-xs font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Remove from favorites
        </button>
      </div>
    </div>
  )
}
