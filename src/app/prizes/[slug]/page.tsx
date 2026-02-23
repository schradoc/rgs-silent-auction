import { Suspense } from 'react'
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

  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#b8941f]/30 border-t-[#b8941f] rounded-full animate-spin" />
      </main>
    }>
      <PrizeDetail prize={prize as any} />
    </Suspense>
  )
}
