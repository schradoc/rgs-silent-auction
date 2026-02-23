import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock cookies
const mockCookieSet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn(),
    set: mockCookieSet,
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

// Mock Resend
const mockResendSend = vi.fn().mockResolvedValue({ id: 'msg-1' })
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockResendSend }
  },
}))

// Mock Twilio (not configured for staging)
vi.mock('twilio', () => ({
  default: () => ({
    messages: { create: vi.fn().mockRejectedValue(new Error('Not configured')) },
  }),
}))

const mockPrisma = {
  bidder: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

describe('Registration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.DATABASE_URL = 'postgresql://test'
    process.env.RESEND_API_KEY = 'test-key'
    process.env.FROM_EMAIL = 'auction@rgsauction.com'
  })

  it('should send verification via WhatsApp on new registration with phone', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue(null) // No existing user
    mockPrisma.bidder.create.mockResolvedValue({
      id: 'new-bidder-1',
      name: 'Alice Wong',
      email: null,
      phone: '+85291234567',
      tableNumber: 'A1',
      phoneVerified: false,
    })

    const { POST } = await import('@/app/api/auth/register/route')

    const request = {
      json: () => Promise.resolve({
        name: 'Alice Wong',
        phone: '91234567',
        tableNumber: 'A1',
      }),
    } as any

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.requiresVerification).toBe(true)
  })

  it('should auto-login already verified user', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'existing-verified',
      name: 'Bob Chan',
      email: 'bob@test.com',
      phone: '+85299876543',
      emailVerified: true,
      phoneVerified: true,
    })

    const { POST } = await import('@/app/api/auth/register/route')

    const request = {
      json: () => Promise.resolve({
        name: 'Bob Chan',
        phone: '99876543',
      }),
    } as any

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.message).toContain('Welcome back')
    expect(body.requiresVerification).toBeUndefined()

    // Should set the auth cookie
    expect(mockCookieSet).toHaveBeenCalledWith(
      'rgs_bidder_id',
      'existing-verified',
      expect.any(Object)
    )
  })

  it('should resend verification code for existing unverified user', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'existing-unverified',
      name: 'Charlie Li',
      email: null,
      phone: '+85291111111',
      emailVerified: false,
      phoneVerified: false,
    })

    mockPrisma.bidder.update.mockResolvedValue({
      id: 'existing-unverified',
      verificationCode: '123456',
    })

    const { POST } = await import('@/app/api/auth/register/route')

    const request = {
      json: () => Promise.resolve({
        name: 'Charlie Li',
        phone: '91111111',
      }),
    } as any

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.requiresVerification).toBe(true)

    // Should have updated with new verification code
    expect(mockPrisma.bidder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing-unverified' },
        data: expect.objectContaining({
          verificationCode: expect.stringMatching(/^\d{6}$/),
        }),
      })
    )
  })

  it('should require name and at least phone or email', async () => {
    const { POST } = await import('@/app/api/auth/register/route')

    // Missing both phone and email
    const request1 = {
      json: () => Promise.resolve({ name: 'Test' }),
    } as any

    const response1 = await POST(request1)
    expect(response1.status).toBe(400)

    // Missing name
    const request2 = {
      json: () => Promise.resolve({ phone: '91234567' }),
    } as any

    const response2 = await POST(request2)
    expect(response2.status).toBe(400)
  })

  it('should accept registration with email only (no phone)', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue(null)
    mockPrisma.bidder.create.mockResolvedValue({
      id: 'email-only',
      name: 'Email User',
      email: 'emailonly@test.com',
      phone: null,
      tableNumber: null,
      phoneVerified: false,
    })

    const { POST } = await import('@/app/api/auth/register/route')

    const request = {
      json: () => Promise.resolve({
        name: 'Email User',
        email: 'emailonly@test.com',
      }),
    } as any

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)

    // Should create bidder with null phone
    expect(mockPrisma.bidder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: null,
        }),
      })
    )
  })

  it('should reject invalid phone number when provided', async () => {
    const { POST } = await import('@/app/api/auth/register/route')

    const request = {
      json: () => Promise.resolve({
        name: 'Bad Phone',
        phone: '123', // Too short
      }),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('valid phone')
  })

  it('should normalize HK phone numbers (+852 prefix)', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue(null)
    mockPrisma.bidder.create.mockResolvedValue({
      id: 'hk-phone',
      name: 'HK Phone',
      email: null,
      phone: '+85291234567',
      tableNumber: null,
      phoneVerified: false,
    })

    const { POST } = await import('@/app/api/auth/register/route')

    const request = {
      json: () => Promise.resolve({
        name: 'HK Phone',
        phone: '91234567', // 8 digit HK number without prefix
      }),
    } as any

    const response = await POST(request)
    expect(response.status).toBe(200)

    expect(mockPrisma.bidder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: '+85291234567',
        }),
      })
    )
  })
})
