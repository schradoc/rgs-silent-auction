import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

// Sample names for generating mock bidders
const FIRST_NAMES = [
  'James', 'Sarah', 'Michael', 'Emma', 'David', 'Sophie', 'Richard', 'Charlotte',
  'William', 'Alice', 'Thomas', 'Victoria', 'Charles', 'Elizabeth', 'Henry', 'Grace',
  'Edward', 'Olivia', 'George', 'Isabella', 'Robert', 'Amelia', 'John', 'Mia',
  'Andrew', 'Emily', 'Philip', 'Sophia', 'Christopher', 'Chloe'
]

const LAST_NAMES = [
  'Wong', 'Chan', 'Lee', 'Chen', 'Smith', 'Johnson', 'Williams', 'Brown',
  'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson',
  'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Walker', 'Hall',
  'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker'
]

// Generate mock data based on existing prizes
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSessionValue = cookieStore.get(COOKIE_NAMES.adminSession)?.value
    const isAdmin = adminSessionValue === 'true'

    // Debug logging
    console.log('Mock data POST - cookies:', {
      cookieName: COOKIE_NAMES.adminSession,
      cookieValue: adminSessionValue,
      isAdmin,
      allCookies: cookieStore.getAll().map(c => ({ name: c.name, valueLength: c.value?.length }))
    })

    if (!isAdmin) {
      return NextResponse.json({
        error: 'Unauthorized',
        debug: {
          expectedCookie: COOKIE_NAMES.adminSession,
          receivedValue: adminSessionValue,
        }
      }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const body = await request.json()
    const { bidderCount = 25, bidsPerPrize = 3 } = body

    // Get all active prizes
    const prizes = await prisma.prize.findMany({
      where: { isActive: true, parentPrizeId: null },
    })

    if (prizes.length === 0) {
      return NextResponse.json({ error: 'No prizes found. Create prizes first.' }, { status: 400 })
    }

    // Generate mock bidders
    const tableNumbers = Array.from({ length: 20 }, (_, i) => String(i + 1))
    const mockBidders = []

    for (let i = 0; i < bidderCount; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
      const name = `${firstName} ${lastName}`
      const email = `mock.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@example.com`
      const tableNumber = tableNumbers[Math.floor(Math.random() * tableNumbers.length)]

      mockBidders.push({
        name,
        email,
        tableNumber,
        emailVerified: true,
        isMockData: true,
      })
    }

    // Create bidders
    const createdBidders = await prisma.bidder.createManyAndReturn({
      data: mockBidders,
    })

    // Generate mock bids for each prize
    let totalBids = 0
    for (const prize of prizes) {
      // Random number of bids for this prize (0 to bidsPerPrize)
      const numBids = Math.floor(Math.random() * (bidsPerPrize + 1))

      if (numBids === 0) continue

      // Select random bidders for this prize
      const shuffledBidders = [...createdBidders].sort(() => Math.random() - 0.5)
      const selectedBidders = shuffledBidders.slice(0, numBids)

      // Generate escalating bids
      let currentBid = prize.minimumBid
      const bidsToCreate = []

      for (let i = 0; i < selectedBidders.length; i++) {
        const bidder = selectedBidders[i]
        const increment = getIncrement(currentBid)
        const bidAmount = currentBid + (i === 0 ? 0 : increment * (Math.floor(Math.random() * 3) + 1))

        bidsToCreate.push({
          amount: bidAmount,
          bidderId: bidder.id,
          prizeId: prize.id,
          status: i === selectedBidders.length - 1 ? 'WINNING' as const : 'OUTBID' as const,
          isMockData: true,
          createdAt: new Date(Date.now() - (selectedBidders.length - i) * 1000 * 60 * Math.floor(Math.random() * 30 + 5)),
        })

        currentBid = bidAmount
      }

      // Create bids
      await prisma.bid.createMany({ data: bidsToCreate })
      totalBids += bidsToCreate.length

      // Update prize with highest bid
      if (bidsToCreate.length > 0) {
        await prisma.prize.update({
          where: { id: prize.id },
          data: { currentHighestBid: currentBid },
        })
      }
    }

    return NextResponse.json({
      success: true,
      created: {
        bidders: createdBidders.length,
        bids: totalBids,
      },
    })
  } catch (error) {
    console.error('Mock data error:', error)
    return NextResponse.json({ error: 'Failed to generate mock data' }, { status: 500 })
  }
}

// Clear all mock data
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get(COOKIE_NAMES.adminSession)?.value === 'true'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Delete mock bids first (due to FK constraints)
    const deletedBids = await prisma.bid.deleteMany({
      where: { isMockData: true },
    })

    // Delete mock bidders
    const deletedBidders = await prisma.bidder.deleteMany({
      where: { isMockData: true },
    })

    // Reset prize current highest bids by recalculating from remaining bids
    const prizes = await prisma.prize.findMany({
      where: { isActive: true },
      include: {
        bids: {
          where: { status: 'WINNING' },
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
    })

    for (const prize of prizes) {
      const highestBid = prize.bids[0]?.amount || 0
      if (prize.currentHighestBid !== highestBid) {
        await prisma.prize.update({
          where: { id: prize.id },
          data: { currentHighestBid: highestBid },
        })
      }
    }

    return NextResponse.json({
      success: true,
      deleted: {
        bidders: deletedBidders.count,
        bids: deletedBids.count,
      },
    })
  } catch (error) {
    console.error('Clear mock data error:', error)
    return NextResponse.json({ error: 'Failed to clear mock data' }, { status: 500 })
  }
}

function getIncrement(amount: number): number {
  if (amount < 1000) return 100
  if (amount < 5000) return 250
  if (amount < 10000) return 500
  if (amount < 25000) return 1000
  if (amount < 50000) return 2500
  return 5000
}
