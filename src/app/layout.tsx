import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Providers } from '@/components/providers'
import { SITE_CONFIG } from '@/lib/constants'

export const metadata: Metadata = {
  title: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e3a5f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
        <StagingBadge />
      </body>
    </html>
  )
}

function StagingBadge() {
  // Build-time check from env var
  const envStaging = process.env.NEXT_PUBLIC_IS_STAGING === 'true'
  if (!envStaging) return null
  return (
    <div className="fixed bottom-2 left-2 z-[9999] px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-yellow-400 text-yellow-900 opacity-80 pointer-events-none select-none">
      Staging
    </div>
  )
}
