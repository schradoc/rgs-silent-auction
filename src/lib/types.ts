import type { Bid, Bidder, Prize, Winner } from '@prisma/client'

export type PrizeWithBids = Prize & {
  bids: Bid[]
  variants?: Prize[]
  _count?: {
    bids: number
  }
}

export type BidWithDetails = Bid & {
  bidder: Bidder
  prize: Prize
}

export type WinnerWithDetails = Winner & {
  bid: Bid
  bidder: Bidder
  prize: Prize
}

export type BidderWithBids = Bidder & {
  bids: (Bid & {
    prize: Prize
  })[]
}

export interface PlaceBidRequest {
  prizeId: string
  amount: number
  bidderId: string
}

export interface PlaceBidResponse {
  success: boolean
  bid?: Bid
  error?: string
}

export interface RegisterBidderRequest {
  name: string
  email: string
  tableNumber: string
}

export interface VerifyEmailRequest {
  email: string
  code: string
}

export interface AdminLoginRequest {
  password: string
}

export interface AuctionStats {
  totalBids: number
  totalBidValue: number
  activeBidders: number
  prizesWithBids: number
  topPrizes: {
    prize: Prize
    bidCount: number
    highestBid: number
  }[]
}

export interface RealtimeBidPayload {
  prizeId: string
  amount: number
  bidderName: string
  tableNumber: string
  timestamp: string
}
