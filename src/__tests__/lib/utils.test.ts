import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  getMinimumBidIncrement,
  getMinimumNextBid,
  generateVerificationCode,
  slugify,
  normalizeHKPhone,
  isValidPhone,
} from '@/lib/utils'

describe('formatCurrency', () => {
  it('should format HKD amounts with no decimals', () => {
    const result = formatCurrency(5000)
    expect(result).toContain('5,000')
    expect(result).toContain('HK')
  })

  it('should format zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('should format large amounts', () => {
    const result = formatCurrency(100000)
    expect(result).toContain('100,000')
  })

  it('should not include decimal places', () => {
    const result = formatCurrency(5000)
    expect(result).not.toContain('.')
  })
})

describe('getMinimumBidIncrement', () => {
  it('should return 500 for bids under 10,000', () => {
    expect(getMinimumBidIncrement(0)).toBe(500)
    expect(getMinimumBidIncrement(5000)).toBe(500)
    expect(getMinimumBidIncrement(9999)).toBe(500)
  })

  it('should return 1000 for bids 10,000-29,999', () => {
    expect(getMinimumBidIncrement(10000)).toBe(1000)
    expect(getMinimumBidIncrement(20000)).toBe(1000)
    expect(getMinimumBidIncrement(29999)).toBe(1000)
  })

  it('should return 2000 for bids 30,000-49,999', () => {
    expect(getMinimumBidIncrement(30000)).toBe(2000)
    expect(getMinimumBidIncrement(40000)).toBe(2000)
    expect(getMinimumBidIncrement(49999)).toBe(2000)
  })

  it('should return 5000 for bids 50,000+', () => {
    expect(getMinimumBidIncrement(50000)).toBe(5000)
    expect(getMinimumBidIncrement(85000)).toBe(5000)
    expect(getMinimumBidIncrement(100000)).toBe(5000)
  })
})

describe('getMinimumNextBid', () => {
  it('should return minimumBid when no current bids', () => {
    expect(getMinimumNextBid(0, 3000)).toBe(3000)
    expect(getMinimumNextBid(0, 10000)).toBe(10000)
  })

  it('should return currentHighestBid + increment when there are bids', () => {
    // 5000 + 500 increment = 5500
    expect(getMinimumNextBid(5000, 3000)).toBe(5500)

    // 10000 + 1000 increment = 11000
    expect(getMinimumNextBid(10000, 3000)).toBe(11000)

    // 30000 + 2000 increment = 32000
    expect(getMinimumNextBid(30000, 5000)).toBe(32000)

    // 50000 + 5000 increment = 55000
    expect(getMinimumNextBid(50000, 10000)).toBe(55000)
  })

  it('should handle edge case at tier boundaries', () => {
    // At exactly 9999 (under 10k): increment is 500
    expect(getMinimumNextBid(9999, 3000)).toBe(10499)

    // At exactly 10000 (10k+): increment is 1000
    expect(getMinimumNextBid(10000, 3000)).toBe(11000)

    // At exactly 29999 (under 30k): increment is 1000
    expect(getMinimumNextBid(29999, 3000)).toBe(30999)

    // At exactly 30000 (30k+): increment is 2000
    expect(getMinimumNextBid(30000, 3000)).toBe(32000)
  })
})

describe('generateVerificationCode', () => {
  it('should generate a 6-digit string', () => {
    const code = generateVerificationCode()
    expect(code).toMatch(/^\d{6}$/)
    expect(code.length).toBe(6)
  })

  it('should generate codes >= 100000', () => {
    // Run multiple times to ensure no 5-digit codes
    for (let i = 0; i < 100; i++) {
      const code = parseInt(generateVerificationCode())
      expect(code).toBeGreaterThanOrEqual(100000)
      expect(code).toBeLessThan(1000000)
    }
  })

  it('should generate different codes (probabilistic)', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 50; i++) {
      codes.add(generateVerificationCode())
    }
    // With 900,000 possible codes, 50 should all be unique
    expect(codes.size).toBe(50)
  })
})

describe('slugify', () => {
  it('should convert to lowercase with dashes', () => {
    expect(slugify('Luxury Watch Collection')).toBe('luxury-watch-collection')
  })

  it('should strip special characters', () => {
    expect(slugify('Hello! World?')).toBe('hello-world')
  })

  it('should collapse multiple dashes', () => {
    expect(slugify('foo---bar')).toBe('foo-bar')
  })

  it('should handle empty string', () => {
    expect(slugify('')).toBe('')
  })
})

describe('Phone validation (extended)', () => {
  describe('normalizeHKPhone', () => {
    it('should handle phone with spaces and dashes', () => {
      expect(normalizeHKPhone('9123 4567')).toBe('+85291234567')
      expect(normalizeHKPhone('9123-4567')).toBe('+85291234567')
      expect(normalizeHKPhone('(852) 9123 4567')).toBe('+85291234567')
    })

    it('should handle international numbers', () => {
      expect(normalizeHKPhone('+44 7700 900123')).toBe('+447700900123')
      expect(normalizeHKPhone('+1 234 567 8900')).toBe('+12345678900')
    })
  })

  describe('isValidPhone', () => {
    it('should accept valid HK mobile numbers', () => {
      expect(isValidPhone('91234567')).toBe(true)
      expect(isValidPhone('+85291234567')).toBe(true)
      expect(isValidPhone('85291234567')).toBe(true)
    })

    it('should accept valid international numbers', () => {
      expect(isValidPhone('+447700900123')).toBe(true)
      expect(isValidPhone('+12345678900')).toBe(true)
    })

    it('should reject too-short numbers', () => {
      expect(isValidPhone('123')).toBe(false)
      expect(isValidPhone('+1234')).toBe(false)
    })

    it('should reject numbers without digits after country code', () => {
      expect(isValidPhone('+')).toBe(false)
    })
  })
})
