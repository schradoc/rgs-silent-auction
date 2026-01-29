'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a singleton Supabase client for realtime
let realtimeClient: ReturnType<typeof createClient> | null = null

function getRealtimeClient() {
  if (!realtimeClient && supabaseUrl && supabaseAnonKey) {
    realtimeClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }
  return realtimeClient
}

interface BidUpdate {
  id: string
  amount: number
  prizeId: string
  bidderId: string
  status: string
  createdAt: string
}

interface UseRealtimeBidsOptions {
  prizeId?: string
  bidderId?: string
  onNewBid?: (bid: BidUpdate) => void
  onOutbid?: (bid: BidUpdate, prizeTitle: string) => void
}

export function useRealtimeBids(options: UseRealtimeBidsOptions = {}) {
  const { prizeId, bidderId, onNewBid, onOutbid } = options
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  const handleBidInsert = useCallback(
    async (payload: { new: BidUpdate }) => {
      const newBid = payload.new

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['prizes'] })
      if (newBid.prizeId) {
        queryClient.invalidateQueries({ queryKey: ['prize', newBid.prizeId] })
      }

      // Call custom handler
      if (onNewBid) {
        onNewBid(newBid)
      }

      // Check if current user was outbid
      if (bidderId && newBid.bidderId !== bidderId) {
        // Fetch prize title for the toast
        try {
          const res = await fetch(`/api/prizes?id=${newBid.prizeId}`)
          const data = await res.json()
          const prize = data.prizes?.[0] || data.prize

          if (prize && onOutbid) {
            onOutbid(newBid, prize.title)
          }
        } catch (err) {
          console.error('Error fetching prize for outbid notification:', err)
        }
      }
    },
    [queryClient, bidderId, onNewBid, onOutbid]
  )

  useEffect(() => {
    const client = getRealtimeClient()
    if (!client) return

    // Build channel name
    const channelName = prizeId ? `bids:prize:${prizeId}` : 'bids:all'

    // Subscribe to bid inserts
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Bid',
          ...(prizeId && { filter: `prizeId=eq.${prizeId}` }),
        },
        handleBidInsert
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        client.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [prizeId, handleBidInsert])

  return {
    isConnected: !!channelRef.current,
  }
}

// Hook specifically for outbid toasts
export function useOutbidToasts(bidderId: string | undefined) {
  useRealtimeBids({
    bidderId,
    onOutbid: (bid, prizeTitle) => {
      toast.error(`You've been outbid!`, {
        description: `Someone bid HK$${bid.amount.toLocaleString()} on "${prizeTitle}"`,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = `/prizes?highlight=${bid.prizeId}`
          },
        },
        duration: 10000,
      })
    },
  })
}
