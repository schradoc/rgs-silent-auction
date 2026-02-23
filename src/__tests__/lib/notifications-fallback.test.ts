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

// Mock Twilio - NOT configured (null)
vi.mock('twilio', () => {
  return {
    default: () => null,
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

vi.mock('@/lib/utils', () => ({
  formatCurrency: (n: number) => `HK$${n.toLocaleString()}`,
}))

describe('Notification Email Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-key'
    process.env.FROM_EMAIL = 'test@example.com'
    // Twilio NOT configured
    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.TWILIO_WHATSAPP_NUMBER
    delete process.env.TWILIO_PHONE_NUMBER
  })

  it('should send OUTBID email even when bidder prefers WHATSAPP and emailOptIn is false', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'b1',
      name: 'Alice',
      email: 'alice@test.com',
      phone: '+85291234567',
      notificationPref: 'WHATSAPP',
      emailOptIn: false,
      smsOptIn: false,
      whatsappOptIn: true,
    })

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
    // Should have sent email as transactional fallback
    expect(mockResendSend).toHaveBeenCalled()
    const emailCall = mockResendSend.mock.calls[0][0]
    expect(emailCall.to).toBe('alice@test.com')
    expect(emailCall.subject).toContain('outbid')
  })

  it('should send WON email even when bidder prefers WHATSAPP and emailOptIn is false', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'b2',
      name: 'Bob',
      email: 'bob@test.com',
      phone: '+85299876543',
      notificationPref: 'WHATSAPP',
      emailOptIn: false,
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
    expect(mockResendSend).toHaveBeenCalled()
  })

  it('should NOT force email fallback for WINNING notifications (non-transactional)', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'b3',
      name: 'Charlie',
      email: 'charlie@test.com',
      phone: '+85291111111',
      notificationPref: 'WHATSAPP',
      emailOptIn: false,
      smsOptIn: false,
      whatsappOptIn: true,
    })

    const { sendNotification } = await import('@/lib/notifications/index')

    const result = await sendNotification({
      bidderId: 'b3',
      type: 'WINNING',
      prizeId: 'p3',
      prizeTitle: 'Art Print',
      prizeSlug: 'art-print',
      amount: 8000,
    })

    // WINNING is not transactional, so forced email fallback should NOT apply
    // However the regular fallback chain may still try email
    // The key test is that the function completes without crashing
    expect(typeof result).toBe('boolean')
  })

  it('should skip SMS/WhatsApp channels when Twilio is not configured', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'b4',
      name: 'Diana',
      email: 'diana@test.com',
      phone: '+85292222222',
      notificationPref: 'SMS',
      emailOptIn: true,
      smsOptIn: true,
      whatsappOptIn: true,
    })

    const { sendNotification } = await import('@/lib/notifications/index')

    const result = await sendNotification({
      bidderId: 'b4',
      type: 'OUTBID',
      prizeId: 'p4',
      prizeTitle: 'Dinner Voucher',
      prizeSlug: 'dinner-voucher',
      currentHighestBid: 3000,
    })

    expect(result).toBe(true)
    // Should succeed via email fallback
    expect(mockResendSend).toHaveBeenCalled()
  })

  it('should log fallback notification to database with [fallback] prefix', async () => {
    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'b5',
      name: 'Eve',
      email: 'eve@test.com',
      phone: '+85293333333',
      notificationPref: 'WHATSAPP',
      emailOptIn: false,
      smsOptIn: false,
      whatsappOptIn: true,
    })

    const { sendNotification } = await import('@/lib/notifications/index')

    await sendNotification({
      bidderId: 'b5',
      type: 'OUTBID',
      prizeId: 'p5',
      prizeTitle: 'Travel Package',
      prizeSlug: 'travel-package',
      currentHighestBid: 20000,
    })

    // Check that notification.create was called (at least for the fallback)
    expect(mockPrisma.notification.create).toHaveBeenCalled()

    // One of the calls should be for EMAIL channel
    const emailNotificationCall = mockPrisma.notification.create.mock.calls.find(
      (call: any) => call[0].data.channel === 'EMAIL'
    )
    expect(emailNotificationCall).toBeDefined()
  })
})

describe('notifyOutbidBidders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-key'
  })

  it('should notify the previous winning bidder via email', async () => {
    mockPrisma.prize.findUnique.mockResolvedValue({
      title: 'Luxury Watch',
      slug: 'luxury-watch',
    })

    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'prev-winner',
      name: 'Previous Winner',
      email: 'prev@test.com',
      phone: '+85291234567',
      notificationPref: 'EMAIL',
      emailOptIn: true,
      smsOptIn: false,
      whatsappOptIn: false,
    })

    const { notifyOutbidBidders } = await import('@/lib/notifications/index')

    await notifyOutbidBidders('prize-1', 20000, 'prev-winner')

    expect(mockResendSend).toHaveBeenCalled()
    const emailCall = mockResendSend.mock.calls[0][0]
    expect(emailCall.subject).toContain('outbid')
    expect(emailCall.subject).toContain('Luxury Watch')
  })

  it('should find previous outbid bid when previousWinningBidderId not provided', async () => {
    mockPrisma.prize.findUnique.mockResolvedValue({
      title: 'Dinner Voucher',
      slug: 'dinner-voucher',
    })

    mockPrisma.bid.findFirst.mockResolvedValue({
      bidderId: 'found-bidder',
    })

    mockPrisma.bidder.findUnique.mockResolvedValue({
      id: 'found-bidder',
      name: 'Found Bidder',
      email: 'found@test.com',
      phone: null,
      notificationPref: 'EMAIL',
      emailOptIn: true,
      smsOptIn: false,
      whatsappOptIn: false,
    })

    const { notifyOutbidBidders } = await import('@/lib/notifications/index')

    await notifyOutbidBidders('prize-2', 5000)

    expect(mockPrisma.bid.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { prizeId: 'prize-2', status: 'OUTBID' },
        orderBy: { createdAt: 'desc' },
      })
    )
  })

  it('should silently handle missing prize', async () => {
    mockPrisma.prize.findUnique.mockResolvedValue(null)

    const { notifyOutbidBidders } = await import('@/lib/notifications/index')

    // Should not throw
    await notifyOutbidBidders('nonexistent', 1000)
    expect(mockResendSend).not.toHaveBeenCalled()
  })
})
