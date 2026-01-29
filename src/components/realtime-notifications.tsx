'use client'

import { useEffect, useState } from 'react'
import { useRealtimeBids } from '@/hooks/useRealtimeBids'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export function RealtimeNotifications() {
  const [bidderId, setBidderId] = useState<string | null>(null)
  const [myBids, setMyBids] = useState<Set<string>>(new Set())

  // Fetch current bidder ID and their bids
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.bidder?.id) {
          setBidderId(data.bidder.id)
        }
      })
      .catch(() => {})

    fetch('/api/my-bids')
      .then((res) => res.json())
      .then((data) => {
        if (data.bids) {
          const prizeIds = new Set<string>(
            data.bids
              .filter((b: { status: string }) => b.status === 'WINNING')
              .map((b: { prizeId: string }) => b.prizeId)
          )
          setMyBids(prizeIds)
        }
      })
      .catch(() => {})
  }, [])

  // Subscribe to all bids
  useRealtimeBids({
    bidderId: bidderId || undefined,
    onNewBid: async (bid) => {
      // Check if this bid outbids us
      if (bidderId && bid.bidderId !== bidderId && myBids.has(bid.prizeId)) {
        // We were outbid on a prize we're winning
        try {
          const res = await fetch(`/api/prizes/${bid.prizeId}`)
          const data = await res.json()
          const prize = data.prize

          if (prize) {
            toast.error(`You've been outbid!`, {
              description: `Someone bid ${formatCurrency(bid.amount)} on "${prize.title}"`,
              action: {
                label: 'Rebid',
                onClick: () => {
                  window.location.href = `/prizes/${prize.slug}`
                },
              },
              duration: 15000,
            })

            // Remove from myBids since we're no longer winning
            setMyBids((prev) => {
              const next = new Set(prev)
              next.delete(bid.prizeId)
              return next
            })
          }
        } catch (err) {
          console.error('Error fetching prize:', err)
        }
      }
    },
  })

  return null // This component just provides side effects
}
