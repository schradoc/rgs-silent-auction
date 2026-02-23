import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Resend
const mockResendSend = vi.fn().mockResolvedValue({ id: 'msg-1' })
vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: mockResendSend }
    },
  }
})

// Mock Twilio
const mockTwilioSend = vi.fn().mockResolvedValue({ sid: 'SM123' })
vi.mock('twilio', () => {
  return {
    default: () => ({
      messages: { create: mockTwilioSend },
    }),
  }
})

// Mock Prisma
const mockPrisma = {
  bidder: { findUnique: vi.fn() },
  notification: { create: vi.fn().mockResolvedValue({}) },
  prize: { findUnique: vi.fn() },
  bid: { findFirst: vi.fn() },
  winner: { findUnique: vi.fn() },
}
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

// Mock utils
vi.mock('@/lib/utils', () => ({
  formatCurrency: (n: number) => `HK$${n.toLocaleString()}`,
}))

describe('sendNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-key'
    process.env.FROM_EMAIL = 'test@example.com'
    process.env.TWILIO_ACCOUNT_SID = 'AC123'
    process.env.TWILIO_AUTH_TOKEN = 'auth-token'
    process.env.TWILIO_WHATSAPP_NUMBER = '+85292906498'
    process.env.TWILIO_PHONE_NUMBER = '+85212345678'
  })

  it('should send via email when bidder prefers EMAIL', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'b1',
      name: 'Alice',
      email: 'alice@test.com',
      phone: '+85291234567',
      notificationPref: 'EMAIL',
      emailOptIn: true,
      smsOptIn: false,
      whatsappOptIn: false,
    })

    // Fresh import to pick up mocks
    const { sendNotification } = await import('@/lib/notifications/index')

    const result = await sendNotification({
      bidderId: 'b1',
      type: 'OUTBID',
      prizeId: 'p1',
      prizeTitle: 'Luxury Watch',
      prizeSlug: 'luxury-watch',
      currentHighestBid: 15000,
    })

    expect(result).toBe(true)
    expect(mockResendSend).toHaveBeenCalled()
    const emailCall = mockResendSend.mock.calls[0][0]
    expect(emailCall.to).toBe('alice@test.com')
    expect(emailCall.subject).toContain('outbid')
  })

  it('should fall back to email when WhatsApp send fails', async () => {
    // Make WhatsApp send fail
    mockTwilioSend.mockRejectedValueOnce(new Error('WhatsApp not verified'))

    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'b2',
      name: 'Bob',
      email: 'bob@test.com',
      phone: '+85299876543',
      notificationPref: 'WHATSAPP',
      emailOptIn: true,
      smsOptIn: false,
      whatsappOptIn: true,
    })

    const { sendNotification } = await import('@/lib/notifications/index')

    const result = await sendNotification({
      bidderId: 'b2',
      type: 'WON',
      prizeId: 'p2',
      prizeTitle: 'Spa Package',
      prizeSlug: 'spa-package',
      amount: 5000,
    })

    expect(result).toBe(true)
    // Should have fallen back to email after WhatsApp failed
    expect(mockResendSend).toHaveBeenCalled()
  })

  it('should include deep link with ?bid=true in outbid notification', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'b3',
      name: 'Charlie',
      email: 'charlie@test.com',
      phone: '+85291111111',
      notificationPref: 'EMAIL',
      emailOptIn: true,
      smsOptIn: false,
      whatsappOptIn: false,
    })

    const { sendNotification } = await import('@/lib/notifications/index')

    await sendNotification({
      bidderId: 'b3',
      type: 'OUTBID',
      prizeId: 'p3',
      prizeTitle: 'Dinner Voucher',
      prizeSlug: 'dinner-voucher',
      currentHighestBid: 3000,
    })

    expect(mockResendSend).toHaveBeenCalled()
    const emailCall = mockResendSend.mock.calls[0][0]
    // The HTML body should contain the deep link
    expect(emailCall.html).toContain('dinner-voucher?bid=true')
  })

  it('should log notification to database', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'b4',
      name: 'Diana',
      email: 'diana@test.com',
      phone: '+85292222222',
      notificationPref: 'EMAIL',
      emailOptIn: true,
      smsOptIn: false,
      whatsappOptIn: false,
    })

    const { sendNotification } = await import('@/lib/notifications/index')

    await sendNotification({
      bidderId: 'b4',
      type: 'WINNING',
      prizeId: 'p4',
      prizeTitle: 'Art Print',
      prizeSlug: 'art-print',
      amount: 8000,
    })

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'WINNING',
          channel: 'EMAIL',
          bidderId: 'b4',
          delivered: true,
        }),
      })
    )
  })
})
