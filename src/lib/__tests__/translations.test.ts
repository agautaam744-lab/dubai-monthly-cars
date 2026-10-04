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

  it('has required navbar keys', () => {
    // Keys that exist in the actual translations file (mix of nav.* and navbar.*)
    const requiredKeys = [
      'nav.home',
      'nav.cars',
      'nav.bookings',
      'nav.dashboard',
      'nav.support',
      'nav.profile',
      'nav.login',
      'nav.logout',
      'nav.admin',
      'navbar.browseCars',
      'navbar.howItWorks',
      'navbar.support',
      'navbar.myBookings',
      'navbar.watchlist',
      'navbar.conditionReport',
      'navbar.damageReport',
      'navbar.notifications',
      'navbar.profile',
      'navbar.login',
      'navbar.dashboard',
      'navbar.language',
      'navbar.english',
      'navbar.arabic',
      'navbar.toggleTheme',
    ]
    
    const enKeys = Object.keys(translations.en)
    const arKeys = Object.keys(translations.ar)
    
    requiredKeys.forEach(key => {
      expect(enKeys).toContain(key)
      expect(arKeys).toContain(key)
    })
  })

  it('has required common keys', () => {
    const commonKeys = ['common.loading', 'common.save', 'common.cancel', 'common.confirm', 'common.back', 'common.next']
    
    const enKeys = Object.keys(translations.en)
    const arKeys = Object.keys(translations.ar)
    
    commonKeys.forEach(key => {
      expect(enKeys).toContain(key)
      expect(arKeys).toContain(key)
    })
  })

  it('translations are not empty strings', () => {
    Object.values(translations.en).forEach(value => {
      expect(value).toBeTruthy()
      expect(typeof value).toBe('string')
    })
    Object.values(translations.ar).forEach(value => {
      expect(value).toBeTruthy()
      expect(typeof value).toBe('string')
    })
  })
})