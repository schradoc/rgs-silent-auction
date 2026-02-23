import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getPrizeBySlug } from '@/lib/db'
import { PrizeDetail } from './prize-detail'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

async function getPledgeTiers(category: string) {
  if (category !== 'PLEDGES') return null

  try {
    const { prisma } = await import('@/lib/prisma')
    const tiers = await prisma.prize.findMany({
      where: {
        category: 'PLEDGES',
        isActive: true,
      },
      orderBy: { tierLevel: 'asc' },
      include: {
        _count: {
          select: { bids: true },
        },
      },
    })
    return tiers
  } catch {
    return null
  }
}

export default async function PrizePage({ params }: Props) {
  const { slug } = await params
  const prize = await getPrizeBySlug(slug)

  if (!prize) {
    notFound()
  }

  const pledgeTiers = await getPledgeTiers(prize.category)

  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a08a1e]/30 border-t-[#a08a1e] rounded-full animate-spin" />
      </main>
    }>
      <PrizeDetail prize={prize as any} pledgeTiers={pledgeTiers as any} />
    </Suspense>
  )
}
