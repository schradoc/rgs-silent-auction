import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      json: () => Promise.resolve(body),
    }),
  },
}))

describe('Auction Status API - Fail-Closed Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should return isAuctionOpen: false on database error', async () => {
    // Mock prisma to throw an error (simulating DB failure)
    vi.mock('@/lib/prisma', () => ({
      prisma: {
        auctionSettings: {
          findUnique: vi.fn().mockRejectedValue(new Error('DB connection failed')),
        },
        prize: {
          count: vi.fn().mockRejectedValue(new Error('DB connection failed')),
          findMany: vi.fn().mockRejectedValue(new Error('DB connection failed')),
        },
        bidder: {
          count: vi.fn().mockRejectedValue(new Error('DB connection failed')),
        },
        bid: {
          count: vi.fn().mockRejectedValue(new Error('DB connection failed')),
        },
      },
    }))

    const { GET } = await import('@/app/api/auction-status/route')

    const request = {} as any
    const response = await GET(request)

    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.isAuctionOpen).toBe(false)
  })
})
