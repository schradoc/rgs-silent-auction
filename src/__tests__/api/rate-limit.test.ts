import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit } from '@/lib/rate-limit'

describe('Rate Limiter', () => {
  const config = { limit: 3, windowMs: 60000 } // 3 per minute

  beforeEach(() => {
    // Each test uses a unique key to avoid interference
  })

  it('should allow requests under the limit', () => {
    const key = `test-allow-${Date.now()}`
    const r1 = checkRateLimit(key, config)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = checkRateLimit(key, config)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = checkRateLimit(key, config)
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('should block requests over the limit', () => {
    const key = `test-block-${Date.now()}`
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    checkRateLimit(key, config)

    const r4 = checkRateLimit(key, config)
    expect(r4.allowed).toBe(false)
    expect(r4.remaining).toBe(0)
    expect(r4.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('should use separate windows for different keys', () => {
    const key1 = `test-sep-a-${Date.now()}`
    const key2 = `test-sep-b-${Date.now()}`

    checkRateLimit(key1, config)
    checkRateLimit(key1, config)
    checkRateLimit(key1, config)

    // key1 exhausted
    const r1 = checkRateLimit(key1, config)
    expect(r1.allowed).toBe(false)

    // key2 should still be available
    const r2 = checkRateLimit(key2, config)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(2)
  })

  it('should provide accurate retry-after seconds', () => {
    const key = `test-retry-${Date.now()}`
    const shortConfig = { limit: 1, windowMs: 30000 } // 1 per 30 seconds

    checkRateLimit(key, shortConfig)
    const r2 = checkRateLimit(key, shortConfig)

    expect(r2.allowed).toBe(false)
    expect(r2.retryAfterSeconds).toBeGreaterThan(0)
    expect(r2.retryAfterSeconds).toBeLessThanOrEqual(30)
  })
})
