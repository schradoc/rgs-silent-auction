import { mockPrizes, getMockPrize, mockBids } from './mock-data'

// Check if database is configured at runtime
function isDatabaseConfigured() {
  return !!process.env.DATABASE_URL
}

export async function getPrizes() {
  if (!isDatabaseConfigured()) {
    console.log('[DB] Using mock data - DATABASE_URL not configured')
    return mockPrizes
  }

  const { prisma } = await import('./prisma')

  try {
    const prizes = await prisma.prize.findMany({
      where: {
        isActive: true,
        parentPrizeId: null,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { minimumBid: 'desc' },
      ],
    })
    return prizes
  } catch (error) {
    console.error('[DB] Error fetching prizes, falling back to mock data:', error)
    return mockPrizes
  }
}

export async function getPrizeBySlug(slug: string) {
  if (!isDatabaseConfigured()) {
    console.log('[DB] Using mock data - DATABASE_URL not configured')
    return getMockPrize(slug)
  }

  const { prisma } = await import('./prisma')

  try {
    const prize = await prisma.prize.findUnique({
      where: { slug },
      include: {
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            bidder: {
              select: {
                tableNumber: true,
              },
            },
          },
        },
        variants: true,
      },
    })
    return prize
  } catch (error) {
    console.error('[DB] Error fetching prize, falling back to mock data:', error)
    return getMockPrize(slug)
  }
}

export { isDatabaseConfigured }
