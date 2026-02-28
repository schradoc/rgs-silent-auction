import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Short redirect for SMS links: /b/[slug] → /prizes/[slug]?bid=true
 * Supports both slug and prize ID (cuid) for short SMS URLs.
 * e.g. rgsauction.com/b/cm7abc123 → /prizes/actual-slug?bid=true
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rgsauction.com'

  // If the slug looks like a cuid (starts with 'c' and is alphanumeric), try ID lookup
  if (/^c[a-z0-9]{20,}$/i.test(slug)) {
    try {
      const { prisma } = await import('@/lib/prisma')
      const prize = await prisma.prize.findUnique({
        where: { id: slug },
        select: { slug: true },
      })
      if (prize) {
        return NextResponse.redirect(`${baseUrl}/prizes/${prize.slug}?bid=true`, 302)
      }
    } catch {
      // Fall through to slug-based redirect
    }
  }

  // Default: treat as slug directly
  return NextResponse.redirect(`${baseUrl}/prizes/${slug}?bid=true`, 302)
}
