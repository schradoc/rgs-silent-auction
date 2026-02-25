import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impact | RGS-HK Silent Auction',
  description:
    'Your bid makes a difference. Every auction lot supports geographical education, scholarships, schools outreach, and research across Hong Kong.',
  openGraph: {
    title: 'Your Impact | RGS-HK Silent Auction',
    description:
      'Auction proceeds fund the RGS-HK Scholarship Fund, Schools Outreach Programme, Young Geographer Awards, and geographical research grants.',
  },
}

export default function ImpactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
