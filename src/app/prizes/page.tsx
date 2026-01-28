import { getPrizes } from '@/lib/db'
import { PrizesPageClient } from './prizes-page-client'

export const dynamic = 'force-dynamic'

export default async function PrizesPage() {
  const prizes = await getPrizes()

  return <PrizesPageClient prizes={prizes as any} />
}
