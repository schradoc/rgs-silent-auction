'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { COOKIE_NAMES } from '@/lib/constants'

interface Bidder {
  id: string
  name: string
  email: string
  tableNumber: string
  emailVerified: boolean
}

interface BidderContextType {
  bidder: Bidder | null
  isLoading: boolean
  setBidder: (bidder: Bidder | null) => void
  logout: () => void
}

const BidderContext = createContext<BidderContextType | undefined>(undefined)

export function BidderProvider({ children }: { children: ReactNode }) {
  const [bidder, setBidderState] = useState<Bidder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const loadBidder = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setBidderState(data.bidder)
        }
      } catch (error) {
        console.error('Failed to load bidder:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBidder()
  }, [])

  const setBidder = (newBidder: Bidder | null) => {
    setBidderState(newBidder)
    if (newBidder) {
      // Store bidder ID in localStorage as backup
      localStorage.setItem(COOKIE_NAMES.bidderId, newBidder.id)
    } else {
      localStorage.removeItem(COOKIE_NAMES.bidderId)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }
    setBidder(null)
  }

  return (
    <BidderContext.Provider value={{ bidder, isLoading, setBidder, logout }}>
      {children}
    </BidderContext.Provider>
  )
}

export function useBidder() {
  const context = useContext(BidderContext)
  if (context === undefined) {
    throw new Error('useBidder must be used within a BidderProvider')
  }
  return context
}
