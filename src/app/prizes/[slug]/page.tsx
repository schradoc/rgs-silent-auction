import { notFound } from 'next/navigation'
import { getPrizeBySlug } from '@/lib/db'
import { PrizeDetail } from './prize-detail'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export default async function PrizePage({ params }: Props) {
  const { slug } = await params
  const prize = await getPrizeBySlug(slug)

  if (!prize) {
    notFound()
  }

  return <PrizeDetail prize={prize as any} />
}
