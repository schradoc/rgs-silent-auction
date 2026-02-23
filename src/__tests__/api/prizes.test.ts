import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock NextResponse
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
  prize: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

describe('GET /api/prizes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should return all active top-level prizes when no id param', async () => {
    const mockPrizes = [
      { id: 'p1', slug: 'luxury-watch', title: 'Luxury Watch', category: 'EXPERIENCES', minimumBid: 5000, currentHighestBid: 12000, imageUrl: '/img.jpg', shortDescription: 'A watch' },
      { id: 'p2', slug: 'dinner-for-two', title: 'Dinner for Two', category: 'DINING', minimumBid: 3000, currentHighestBid: 0, imageUrl: '/img2.jpg', shortDescription: 'Dinner' },
    ]
    mockPrisma.prize.findMany.mockResolvedValue(mockPrizes)

    const { GET } = await import('@/app/api/prizes/route')

    const request = { url: 'http://localhost:3000/api/prizes' } as any
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.prizes).toHaveLength(2)
    expect(body.prizes[0].id).toBe('p1')
    expect(mockPrisma.prize.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, parentPrizeId: null },
        orderBy: { displayOrder: 'asc' },
      })
    )
  })

  it('should return a single prize when ?id= param is provided', async () => {
    const mockPrize = { id: 'p1', slug: 'luxury-watch', title: 'Luxury Watch', category: 'EXPERIENCES', minimumBid: 5000, currentHighestBid: 12000, imageUrl: '/img.jpg', shortDescription: 'A watch' }
    mockPrisma.prize.findUnique.mockResolvedValue(mockPrize)

    const { GET } = await import('@/app/api/prizes/route')

    const request = { url: 'http://localhost:3000/api/prizes?id=p1' } as any
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.prize).toBeDefined()
    expect(body.prize.id).toBe('p1')
    expect(body.prizes).toBeUndefined()
    expect(mockPrisma.prize.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
      })
    )
  })

  it('should return 404 when ?id= param points to non-existent prize', async () => {
    mockPrisma.prize.findUnique.mockResolvedValue(null)

    const { GET } = await import('@/app/api/prizes/route')

    const request = { url: 'http://localhost:3000/api/prizes?id=nonexistent' } as any
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.prize).toBeNull()
    expect(body.error).toContain('not found')
  })

  it('should NOT call findMany when id param is provided', async () => {
    mockPrisma.prize.findUnique.mockResolvedValue({ id: 'p1', title: 'Test' })

    const { GET } = await import('@/app/api/prizes/route')

    const request = { url: 'http://localhost:3000/api/prizes?id=p1' } as any
    await GET(request)

    expect(mockPrisma.prize.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.prize.findUnique).toHaveBeenCalledTimes(1)
  })

  it('should NOT call findUnique when no id param', async () => {
    mockPrisma.prize.findMany.mockResolvedValue([])

    const { GET } = await import('@/app/api/prizes/route')

    const request = { url: 'http://localhost:3000/api/prizes' } as any
    await GET(request)

    expect(mockPrisma.prize.findUnique).not.toHaveBeenCalled()
    expect(mockPrisma.prize.findMany).toHaveBeenCalledTimes(1)
  })

  it('should handle database errors gracefully', async () => {
    mockPrisma.prize.findMany.mockRejectedValue(new Error('DB connection failed'))

    const { GET } = await import('@/app/api/prizes/route')

    const request = { url: 'http://localhost:3000/api/prizes' } as any
    const response = await GET(request)
    const body = await response.json()

    expect(body.prizes).toEqual([])
    expect(body.error).toBeDefined()
  })
})
