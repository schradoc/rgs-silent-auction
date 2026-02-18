import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock modules before imports
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn(),
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

// Mock rate limiting to always allow
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 5, retryAfterSeconds: 0 }),
  getClientIP: () => '127.0.0.1',
  rateLimitResponse: () => ({ status: 429 }),
  RATE_LIMITS: { authVerify: { limit: 5, windowMs: 900000 } },
}))

const mockPrisma = {
  bidder: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

describe('Auth Verify API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.DATABASE_URL = 'postgresql://test'
  })

  it('should reject any 6-digit code that does not match stored code', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'bidder-1',
      email: 'test@example.com',
      verificationCode: '123456',
      updatedAt: new Date(), // fresh code
    })

    // Import fresh to get updated env
    const { POST } = await import('@/app/api/auth/verify/route')

    const request = {
      json: () => Promise.resolve({ email: 'test@example.com', code: '654321' }),
      headers: new Map(),
    } as unknown as Request

    const response = await POST(request as any)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Invalid verification code')
  })

  it('should reject if no verification code is pending', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'bidder-1',
      email: 'test@example.com',
      verificationCode: null, // already verified
      updatedAt: new Date(),
    })

    const { POST } = await import('@/app/api/auth/verify/route')

    const request = {
      json: () => Promise.resolve({ email: 'test@example.com', code: '123456' }),
      headers: new Map(),
    } as unknown as Request

    const response = await POST(request as any)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('No verification pending')
  })

  it('should reject expired verification codes', async () => {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000)

    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'bidder-1',
      email: 'test@example.com',
      verificationCode: '123456',
      updatedAt: twentyMinutesAgo, // expired
    })

    mockPrisma.bidder.update.mockResolvedValue({})

    const { POST } = await import('@/app/api/auth/verify/route')

    const request = {
      json: () => Promise.resolve({ email: 'test@example.com', code: '123456' }),
      headers: new Map(),
    } as unknown as Request

    const response = await POST(request as any)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('expired')
  })

  it('should accept correct verification code', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'bidder-1',
      email: 'test@example.com',
      verificationCode: '123456',
      updatedAt: new Date(), // fresh
    })

    mockPrisma.bidder.update.mockResolvedValue({
      id: 'bidder-1',
      name: 'Test User',
      email: 'test@example.com',
      tableNumber: 'A1',
      emailVerified: true,
    })

    const { POST } = await import('@/app/api/auth/verify/route')

    const request = {
      json: () => Promise.resolve({ email: 'test@example.com', code: '123456' }),
      headers: new Map(),
    } as unknown as Request

    const response = await POST(request as any)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
  })
})
