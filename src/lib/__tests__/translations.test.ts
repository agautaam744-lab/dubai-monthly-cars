import { translations } from '@/lib/translations'

describe('translations', () => {
  it('has english translations', () => {
    expect(translations.en).toBeDefined()
    expect(typeof translations.en).toBe('object')
  })

  it('has arabic translations', () => {
    expect(translations.ar).toBeDefined()
    expect(typeof translations.ar).toBe('object')
  })

  it('has same keys in both languages', () => {
    const enKeys = Object.keys(translations.en).sort()
    const arKeys = Object.keys(translations.ar).sort()
    expect(arKeys).toEqual(enKeys)
  })

  it('has required common keys', () => {
    // Use actual keys from the translation file
    expect(translations.en).toHaveProperty('navbar.browseCars')
    expect(translations.en).toHaveProperty('navbar.howItWorks')
    expect(translations.en).toHaveProperty('navbar.myBookings')
    expect(translations.en).toHaveProperty('navbar.support')
    expect(translations.en).toHaveProperty('common.loading')
    expect(translations.en).toHaveProperty('common.save')
    expect(translations.en).toHaveProperty('common.cancel')
    expect(translations.en).toHaveProperty('common.confirm')
    
    expect(translations.ar).toHaveProperty('navbar.browseCars')
    expect(translations.ar).toHaveProperty('navbar.howItWorks')
    expect(translations.ar).toHaveProperty('navbar.myBookings')
    expect(translations.ar).toHaveProperty('navbar.support')
    expect(translations.ar).toHaveProperty('common.loading')
    expect(translations.ar).toHaveProperty('common.save')
    expect(translations.ar).toHaveProperty('common.cancel')
    expect(translations.ar).toHaveProperty('common.confirm')
  })

  it('translations are not empty strings', () => {
    Object.values(translations.en).forEach(value => {
      expect(value).toBeTruthy()
      expect(typeof value).toBe('string')
    })
  })
})