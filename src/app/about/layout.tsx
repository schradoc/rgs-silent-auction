import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | RGS-HK Silent Auction',
  description:
    'Three decades of discovery. Learn about the Royal Geographical Society Hong Kong, founded in 1995 as the first overseas branch of the RGS London.',
  openGraph: {
    title: 'About the Royal Geographical Society Hong Kong',
    description:
      'Since 1995, RGS-HK has connected Hong Kong with the world\u2019s greatest explorers, geographers, and adventurers. The largest English-medium society in Hong Kong.',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
