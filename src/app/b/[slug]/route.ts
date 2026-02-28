import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Short redirect for SMS links: /b/[slug] → /prizes/[slug]?bid=true
 * Keeps SMS URLs under 40 chars (e.g. rgsauction.com/b/zambezi-safari)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rgsauction.com'
  return NextResponse.redirect(`${baseUrl}/prizes/${slug}?bid=true`, 302)
}
