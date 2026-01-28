import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PrizeDetail } from './prize-detail'

interface Props {
  params: Promise<{ slug: string }>
}

async function getPrize(slug: string) {
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
}

export default async function PrizePage({ params }: Props) {
  const { slug } = await params
  const prize = await getPrize(slug)

  if (!prize) {
    notFound()
  }

  return <PrizeDetail prize={prize} />
}

// Dynamic route - no static params needed for SSR
export const dynamic = 'force-dynamic'
