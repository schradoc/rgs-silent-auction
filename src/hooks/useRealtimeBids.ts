'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
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

export type ConnectionState = 'connected' | 'connecting' | 'disconnected'

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

const RECONNECT_DELAY = 2000
const FALLBACK_POLL_INTERVAL = 30000

export function useRealtimeBids(options: UseRealtimeBidsOptions = {}) {
  const { prizeId, bidderId, onNewBid, onOutbid } = options
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')

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

  // Fallback polling when disconnected
  const startFallbackPolling = useCallback(() => {
    if (pollTimerRef.current) return
    pollTimerRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['prizes'] })
      if (prizeId) {
        queryClient.invalidateQueries({ queryKey: ['prize', prizeId] })
      }
    }, FALLBACK_POLL_INTERVAL)
  }, [queryClient, prizeId])

  const stopFallbackPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const subscribe = useCallback(() => {
    const client = getRealtimeClient()
    if (!client) return

    // Clean up existing channel
    if (channelRef.current) {
      client.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channelName = prizeId ? `bids:prize:${prizeId}` : 'bids:all'

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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionState('connected')
          stopFallbackPolling()
          // Clear any pending reconnect
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionState('disconnected')
          startFallbackPolling()
          // Auto-reconnect after delay
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null
              setConnectionState('connecting')
              subscribe()
            }, RECONNECT_DELAY)
          }
        } else if (status === 'TIMED_OUT') {
          setConnectionState('disconnected')
          startFallbackPolling()
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null
              setConnectionState('connecting')
              subscribe()
            }, RECONNECT_DELAY)
          }
        }
      })

    channelRef.current = channel
  }, [prizeId, handleBidInsert, startFallbackPolling, stopFallbackPolling])

  useEffect(() => {
    subscribe()

    return () => {
      const client = getRealtimeClient()
      if (channelRef.current && client) {
        client.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      stopFallbackPolling()
    }
  }, [subscribe, stopFallbackPolling])

  return {
    connectionState,
    isConnected: connectionState === 'connected',
  }
}

// Hook specifically for outbid toasts
export function useOutbidToasts(bidderId: string | undefined) {
  const { connectionState } = useRealtimeBids({
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

  return { connectionState }
}
