import { describe, it, expect } from 'vitest'
import { normalizeHKPhone, isValidPhone } from '@/lib/utils'

describe('normalizeHKPhone', () => {
  it('should prepend +852 to 8-digit HK numbers', () => {
    expect(normalizeHKPhone('91234567')).toBe('+85291234567')
  })

  it('should handle 852 prefix without +', () => {
    expect(normalizeHKPhone('85291234567')).toBe('+85291234567')
  })

  it('should keep numbers that already have + prefix', () => {
    expect(normalizeHKPhone('+85291234567')).toBe('+85291234567')
  })

  it('should strip spaces, dashes, and parentheses', () => {
    expect(normalizeHKPhone('9123 4567')).toBe('+85291234567')
    expect(normalizeHKPhone('9123-4567')).toBe('+85291234567')
    expect(normalizeHKPhone('(852) 9123 4567')).toBe('+85291234567')
  })

  it('should pass through international numbers unchanged', () => {
    expect(normalizeHKPhone('+447911123456')).toBe('+447911123456')
    expect(normalizeHKPhone('+14155551234')).toBe('+14155551234')
  })
})

describe('isValidPhone', () => {
  it('should accept valid HK numbers', () => {
    expect(isValidPhone('91234567')).toBe(true)
    expect(isValidPhone('+85291234567')).toBe(true)
    expect(isValidPhone('85291234567')).toBe(true)
  })

  it('should accept valid international numbers', () => {
    expect(isValidPhone('+447911123456')).toBe(true)
    expect(isValidPhone('+14155551234')).toBe(true)
  })

  it('should reject invalid numbers', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('123')).toBe(false)
    expect(isValidPhone('abc')).toBe(false)
  })
})
