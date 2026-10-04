import { formatAED } from '@/lib/utils/currency'

describe('formatAED', () => {
  it('formats zero correctly', () => {
    expect(formatAED(0)).toBe('AED\u00A00')
  })

  it('formats whole numbers', () => {
    expect(formatAED(100)).toBe('AED\u00A0100')
    expect(formatAED(1000)).toBe('AED\u00A01,000')
    expect(formatAED(1000000)).toBe('AED\u00A01,000,000')
  })

  it('formats decimal numbers (rounds to nearest)', () => {
    expect(formatAED(100.5)).toBe('AED\u00A0101')
    expect(formatAED(100.4)).toBe('AED\u00A0100')
  })

  it('handles string input', () => {
    expect(formatAED('1000')).toBe('AED\u00A01,000')
  })

  it('handles large numbers', () => {
    expect(formatAED(999999999)).toBe('AED\u00A0999,999,999')
  })
})