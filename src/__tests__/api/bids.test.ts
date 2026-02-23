import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock cookies
const mockCookieGet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: mockCookieGet,
    set: vi.fn(),
  })),
}))

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

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 5, retryAfterSeconds: 0 }),
  rateLimitResponse: () => ({ status: 429, json: () => Promise.resolve({ error: 'Rate limited' }) }),
  RATE_LIMITS: { bidSubmit: { limit: 10, windowMs: 60000 } },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

// Mock notifications (async import in bid route)
vi.mock('@/lib/notifications', () => ({
  notifyOutbidBidders: vi.fn().mockResolvedValue(undefined),
}))

const mockTransactionFn = vi.fn()
const mockPrisma = {
  $transaction: (fn: Function) => fn(mockTransactionFn),
  bid: {
    findMany: vi.fn(),
  },
}

// The transaction proxy object
const mockTx = {
  $queryRaw: vi.fn(),
  auctionSettings: { findUnique: vi.fn() },
  bidder: { findUnique: vi.fn() },
  bid: {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  prize: { update: vi.fn() },
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: (fn: Function) => fn(mockTx),
    bid: { findMany: vi.fn() },
  },
}))

describe('POST /api/bids - Bid Placement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.DATABASE_URL = 'postgresql://test'
    // Set up authenticated bidder
    mockCookieGet.mockReturnValue({ value: 'bidder-1' })
  })

  it('should reject unauthenticated bid attempts', async () => {
    mockCookieGet.mockReturnValue(undefined)

    const { POST } = await import('@/app/api/bids/route')

    const request = {
      json: () => Promise.resolve({ prizeId: 'p1', amount: 5000 }),
      headers: new Map(),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toContain('register')
  })

  it('should reject bid without prizeId or amount', async () => {
    const { POST } = await import('@/app/api/bids/route')

    const request = {
      json: () => Promise.resolve({ prizeId: 'p1' }), // missing amount
      headers: new Map(),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should successfully place a competitive bid', async () => {
    // Prize with row lock returns
    mockTx.$queryRaw.mockResolvedValue([{
      id: 'p1',
      isActive: true,
      currentHighestBid: 5000,
      minimumBid: 3000,
      category: 'TRAVEL',
      multiWinnerEligible: false,
    }])

    // Auction is open
    mockTx.auctionSettings.findUnique.mockResolvedValue({
      id: 'settings',
      isAuctionOpen: true,
    })

    // Bidder exists
    mockTx.bidder.findUnique.mockResolvedValue({
      id: 'bidder-1',
      name: 'Test Bidder',
    })

    // Previous winning bid
    mockTx.bid.findFirst.mockResolvedValue({
      bidderId: 'prev-bidder',
    })

    mockTx.bid.updateMany.mockResolvedValue({ count: 1 })

    mockTx.bid.create.mockResolvedValue({
      id: 'bid-new',
      amount: 5500,
      bidderId: 'bidder-1',
      prizeId: 'p1',
      status: 'WINNING',
    })

    mockTx.prize.update.mockResolvedValue({})

    const { POST } = await import('@/app/api/bids/route')

    const request = {
      json: () => Promise.resolve({ prizeId: 'p1', amount: 5500 }),
      headers: new Map(),
    } as any

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.bid.status).toBe('WINNING')
  })

  it('should reject bid below minimum next bid (BID_TOO_LOW)', async () => {
    mockTx.$queryRaw.mockResolvedValue([{
      id: 'p1',
      isActive: true,
      currentHighestBid: 10000,
      minimumBid: 3000,
      category: 'EXPERIENCES',
      multiWinnerEligible: false,
    }])

    mockTx.auctionSettings.findUnique.mockResolvedValue({
      id: 'settings',
      isAuctionOpen: true,
    })

    const { POST } = await import('@/app/api/bids/route')

    // currentHighestBid is 10000, minimum increment for 10000 is 1000
    // So minimum next bid is 11000
    const request = {
      json: () => Promise.resolve({ prizeId: 'p1', amount: 10500 }),
      headers: new Map(),
    } as any

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe('BID_TOO_LOW')
    expect(body.minimumBid).toBe(11000)
  })

  it('should allow pledge at minimum bid without outbid logic', async () => {
    mockTx.$queryRaw.mockResolvedValue([{
      id: 'pledge-1',
      isActive: true,
      currentHighestBid: 10000,
      minimumBid: 10000,
      category: 'PLEDGES',
      multiWinnerEligible: true,
    }])

    mockTx.auctionSettings.findUnique.mockResolvedValue({
      id: 'settings',
      isAuctionOpen: true,
    })

    mockTx.bidder.findUnique.mockResolvedValue({
      id: 'bidder-1',
      name: 'Pledger',
    })

    mockTx.bid.create.mockResolvedValue({
      id: 'pledge-bid',
      amount: 10000,
      bidderId: 'bidder-1',
      prizeId: 'pledge-1',
      status: 'WINNING',
    })

    mockTx.prize.update.mockResolvedValue({})

    const { POST } = await import('@/app/api/bids/route')

    const request = {
      json: () => Promise.resolve({ prizeId: 'pledge-1', amount: 10000 }),
      headers: new Map(),
    } as any

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)

    // For pledges, should NOT mark previous bids as OUTBID
    expect(mockTx.bid.updateMany).not.toHaveBeenCalled()
  })

  it('should reject pledge below minimum bid', async () => {
    mockTx.$queryRaw.mockResolvedValue([{
      id: 'pledge-1',
      isActive: true,
      currentHighestBid: 10000,
      minimumBid: 10000,
      category: 'PLEDGES',
      multiWinnerEligible: true,
    }])

    mockTx.auctionSettings.findUnique.mockResolvedValue({
      id: 'settings',
      isAuctionOpen: true,
    })

    const { POST } = await import('@/app/api/bids/route')

    const request = {
      json: () => Promise.resolve({ prizeId: 'pledge-1', amount: 5000 }),
      headers: new Map(),
    } as any

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe('BID_TOO_LOW')
  })

  it('should reject bids when auction is closed', async () => {
    mockTx.$queryRaw.mockResolvedValue([{
      id: 'p1',
      isActive: true,
      currentHighestBid: 5000,
      minimumBid: 3000,
      category: 'TRAVEL',
      multiWinnerEligible: false,
    }])

    mockTx.auctionSettings.findUnique.mockResolvedValue({
      id: 'settings',
      isAuctionOpen: false,
    })

    const { POST } = await import('@/app/api/bids/route')

    const request = {
      json: () => Promise.resolve({ prizeId: 'p1', amount: 6000 }),
      headers: new Map(),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('closed')
  })

  it('should reject bids on inactive prizes', async () => {
    mockTx.$queryRaw.mockResolvedValue([{
      id: 'p1',
      isActive: false,
      currentHighestBid: 5000,
      minimumBid: 3000,
      category: 'TRAVEL',
      multiWinnerEligible: false,
    }])

    const { POST } = await import('@/app/api/bids/route')

    const request = {
      json: () => Promise.resolve({ prizeId: 'p1', amount: 6000 }),
      headers: new Map(),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('no longer available')
  })

  it('should return 404 for non-existent prize', async () => {
    mockTx.$queryRaw.mockResolvedValue([]) // Empty result

    const { POST } = await import('@/app/api/bids/route')

    const request = {
      json: () => Promise.resolve({ prizeId: 'nonexistent', amount: 5000 }),
      headers: new Map(),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it('should mark previous winning bid as OUTBID for competitive prizes', async () => {
    mockTx.$queryRaw.mockResolvedValue([{
      id: 'p1',
      isActive: true,
      currentHighestBid: 5000,
      minimumBid: 3000,
      category: 'TRAVEL',
      multiWinnerEligible: false,
    }])

    mockTx.auctionSettings.findUnique.mockResolvedValue({
      id: 'settings',
      isAuctionOpen: true,
    })

    mockTx.bidder.findUnique.mockResolvedValue({
      id: 'bidder-1',
      name: 'New Bidder',
    })

    mockTx.bid.findFirst.mockResolvedValue({
      bidderId: 'prev-bidder',
    })

    mockTx.bid.updateMany.mockResolvedValue({ count: 1 })

    mockTx.bid.create.mockResolvedValue({
      id: 'bid-new',
      amount: 5500,
      bidderId: 'bidder-1',
      prizeId: 'p1',
      status: 'WINNING',
    })

    mockTx.prize.update.mockResolvedValue({})

    const { POST } = await import('@/app/api/bids/route')

    const request = {
      json: () => Promise.resolve({ prizeId: 'p1', amount: 5500 }),
      headers: new Map(),
    } as any

    await POST(request)

    // Should have marked previous WINNING bids as OUTBID
    expect(mockTx.bid.updateMany).toHaveBeenCalledWith({
      where: { prizeId: 'p1', status: 'WINNING' },
      data: { status: 'OUTBID' },
    })
  })
})
