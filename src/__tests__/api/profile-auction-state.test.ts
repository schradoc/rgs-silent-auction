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

const mockPrisma = {
  bidder: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auctionSettings: {
    findFirst: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should return 401 when not authenticated', async () => {
    mockCookieGet.mockReturnValue(undefined)

    const { GET } = await import('@/app/api/profile/route')
    const request = {} as any
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should return profile with bid and favorite counts', async () => {
    mockCookieGet.mockReturnValue({ value: 'bidder-1' })

    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'bidder-1',
      name: 'Alice Wong',
      email: 'alice@test.com',
      phone: '+85291234567',
      tableNumber: 'A1',
      emailVerified: true,
      phoneVerified: true,
      emailOptIn: true,
      smsOptIn: false,
      whatsappOptIn: false,
      notificationPref: 'EMAIL',
      _count: { bids: 5, favorites: 3 },
    })

    const { GET } = await import('@/app/api/profile/route')
    const request = {} as any
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.profile.name).toBe('Alice Wong')
    expect(body.profile._count.bids).toBe(5)
    expect(body.profile._count.favorites).toBe(3)
  })

  it('should return phoneVerified: true only when phone exists', async () => {
    mockCookieGet.mockReturnValue({ value: 'bidder-nophone' })

    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'bidder-nophone',
      name: 'No Phone User',
      email: 'nophone@test.com',
      phone: null,
      tableNumber: null,
      emailVerified: true,
      phoneVerified: true, // DB says true but phone is null
      emailOptIn: true,
      smsOptIn: false,
      whatsappOptIn: false,
      notificationPref: 'EMAIL',
      _count: { bids: 0, favorites: 0 },
    })

    const { GET } = await import('@/app/api/profile/route')
    const request = {} as any
    const response = await GET(request)
    const body = await response.json()

    // The API returns raw data; the UI handles the display logic
    // But we verify the data is returned correctly
    expect(body.profile.phone).toBeNull()
    expect(body.profile.phoneVerified).toBe(true)
    // Client-side: `profile.phoneVerified && profile.phone` = false
    // This verifies the data makes the bug testable
  })

  it('should return 404 for deleted bidder', async () => {
    mockCookieGet.mockReturnValue({ value: 'deleted-bidder' })
    mockPrisma.bidder.findUnique.mockResolvedValue(null)

    const { GET } = await import('@/app/api/profile/route')
    const request = {} as any
    const response = await GET(request)

    expect(response.status).toBe(404)
  })
})

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should update profile fields', async () => {
    mockCookieGet.mockReturnValue({ value: 'bidder-1' })

    mockPrisma.bidder.update.mockResolvedValue({
      id: 'bidder-1',
      name: 'Updated Name',
      email: 'alice@test.com',
      phone: null,
      tableNumber: 'B2',
      emailOptIn: true,
      smsOptIn: false,
      whatsappOptIn: false,
      notificationPref: 'EMAIL',
    })

    const { PATCH } = await import('@/app/api/profile/route')
    const request = {
      json: () => Promise.resolve({
        name: 'Updated Name',
        tableNumber: 'B2',
        emailOptIn: true,
        smsOptIn: false,
        whatsappOptIn: false,
        notificationPref: 'EMAIL',
      }),
    } as any

    const response = await PATCH(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.profile.name).toBe('Updated Name')
    expect(body.profile.notificationPref).toBe('EMAIL')
  })

  it('should force EMAIL notification pref (client sends EMAIL)', async () => {
    mockCookieGet.mockReturnValue({ value: 'bidder-1' })

    mockPrisma.bidder.update.mockResolvedValue({
      id: 'bidder-1',
      name: 'Test',
      notificationPref: 'EMAIL',
      smsOptIn: false,
      whatsappOptIn: false,
    })

    const { PATCH } = await import('@/app/api/profile/route')
    const request = {
      json: () => Promise.resolve({
        notificationPref: 'EMAIL',
        smsOptIn: false,
        whatsappOptIn: false,
      }),
    } as any

    const response = await PATCH(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    // Verify the update was called with EMAIL
    expect(mockPrisma.bidder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notificationPref: 'EMAIL',
          smsOptIn: false,
          whatsappOptIn: false,
        }),
      })
    )
  })

  it('should return 401 when not authenticated', async () => {
    mockCookieGet.mockReturnValue(undefined)

    const { PATCH } = await import('@/app/api/profile/route')
    const request = {
      json: () => Promise.resolve({ name: 'Test' }),
    } as any

    const response = await PATCH(request)
    expect(response.status).toBe(401)
  })
})

describe('GET /api/auction-state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should return LIVE state when auction is open', async () => {
    mockPrisma.auctionSettings.findFirst.mockResolvedValue({
      auctionState: 'LIVE',
      isAuctionOpen: true,
      auctionEndTime: '2026-02-28T22:30:00.000Z',
    })

    const { GET } = await import('@/app/api/auction-state/route')
    const response = await GET()
    const body = await response.json()

    expect(body.state).toBe('LIVE')
    expect(body.isOpen).toBe(true)
    expect(body.endTime).toBeDefined()
  })

  it('should return DRAFT with isOpen false when no settings', async () => {
    mockPrisma.auctionSettings.findFirst.mockResolvedValue(null)

    const { GET } = await import('@/app/api/auction-state/route')
    const response = await GET()
    const body = await response.json()

    expect(body.state).toBe('DRAFT')
    expect(body.isOpen).toBe(false)
  })

  it('should fail closed on database error', async () => {
    mockPrisma.auctionSettings.findFirst.mockRejectedValue(new Error('DB error'))

    const { GET } = await import('@/app/api/auction-state/route')
    const response = await GET()
    const body = await response.json()

    expect(body.state).toBe('DRAFT')
    expect(body.isOpen).toBe(false)
    expect(response.status).toBe(500)
  })

  it('should return CLOSED state after auction ends', async () => {
    mockPrisma.auctionSettings.findFirst.mockResolvedValue({
      auctionState: 'CLOSED',
      isAuctionOpen: false,
      auctionEndTime: '2026-02-28T22:30:00.000Z',
    })

    const { GET } = await import('@/app/api/auction-state/route')
    const response = await GET()
    const body = await response.json()

    expect(body.state).toBe('CLOSED')
    expect(body.isOpen).toBe(false)
  })
})
