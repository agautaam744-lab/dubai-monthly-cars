export function formatAED(value: number | string): string {
  const num: number = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return 'AED 0'
  
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(num)
}

export function parseAED(value: string): number {
  return parseFloat(value.replace(/[^\d.-]/g, '')) || 0
}

export function calculateTotal(...amounts: (number | string)[]): number {
  return amounts.reduce<number>((sum, amt) => {
    const num: number = typeof amt === 'string' ? parseFloat(amt) : amt
    return sum + (Number.isNaN(num) ? 0 : num)
  }, 0)
}