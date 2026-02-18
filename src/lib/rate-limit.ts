import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  timestamps: number[]
}

// In-memory sliding window store (sufficient for single Vercel instance / one-night event)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  const cutoff = now - windowMs * 2
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => t > cutoff)
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }
  }
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  cleanup(config.windowMs)

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  if (entry.timestamps.length >= config.limit) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = oldestInWindow + config.windowMs - now
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    }
  }

  entry.timestamps.push(now)
  return {
    allowed: true,
    remaining: config.limit - entry.timestamps.length,
    retryAfterSeconds: 0,
  }
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfterSeconds.toString(),
      },
    }
  )
}

// Pre-configured rate limit configs
export const RATE_LIMITS = {
  helperLogin: { limit: 5, windowMs: 15 * 60 * 1000 },   // 5 attempts per 15 min
  authVerify: { limit: 5, windowMs: 15 * 60 * 1000 },     // 5 attempts per 15 min
  adminLogin: { limit: 5, windowMs: 30 * 60 * 1000 },     // 5 attempts per 30 min
  bidSubmit: { limit: 10, windowMs: 60 * 1000 },           // 10 bids per minute
} as const
