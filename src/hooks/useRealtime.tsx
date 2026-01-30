'use client'

import { useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import type { RealtimeBidPayload } from '@/lib/types'

export function useRealtimePrizes() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return // Supabase not configured

    // Subscribe to prize updates (when currentHighestBid changes)
    const channel = supabase
      .channel('prize-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Prize',
        },
        (payload) => {
          // Invalidate prize queries to refetch
          queryClient.invalidateQueries({ queryKey: ['prizes'] })
          queryClient.invalidateQueries({ queryKey: ['prize', payload.new.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}

export function useRealtimeBids(prizeId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return // Supabase not configured

    const filter = prizeId ? `prizeId=eq.${prizeId}` : undefined

    const channel = supabase
      .channel(`bids-${prizeId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Bid',
          filter,
        },
        (payload) => {
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['bids'] })
          if (prizeId) {
            queryClient.invalidateQueries({ queryKey: ['bids', prizeId] })
          }
          queryClient.invalidateQueries({ queryKey: ['prizes'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [prizeId, queryClient])
}

export function useBidNotifications(bidderId: string | undefined, onOutbid: (payload: RealtimeBidPayload) => void) {
  const handleOutbid = useCallback(onOutbid, [onOutbid])

  useEffect(() => {
    if (!bidderId) return

    const supabase = getSupabase()
    if (!supabase) return // Supabase not configured

    // Subscribe to a custom channel for outbid notifications
    const channel = supabase
      .channel(`outbid-${bidderId}`)
      .on('broadcast', { event: 'outbid' }, ({ payload }) => {
        handleOutbid(payload as RealtimeBidPayload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bidderId, handleOutbid])
}
