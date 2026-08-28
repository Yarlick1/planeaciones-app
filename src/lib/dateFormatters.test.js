import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange } from './dateFormatters'

describe('dateFormatters', () => {
  it('formats ISO dates in Spanish short format', () => {
    expect(formatDate('2026-09-01')).toBe('1 sep 2026')
  })

  it('formats date ranges', () => {
    expect(formatDateRange('2026-09-01', '2026-09-15')).toBe('1 sep 2026 a 15 sep 2026')
  })

  it('handles empty dates', () => {
    expect(formatDate('')).toBe('Sin fecha')
  })
})
