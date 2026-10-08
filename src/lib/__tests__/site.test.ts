import { siteConfig } from '@/lib/site'

describe('siteConfig', () => {
  it('has required brand properties', () => {
    expect(siteConfig.brand).toBe('Dubai Monthly Cars')
    expect(siteConfig.shortBrand).toBe('DMC')
    expect(siteConfig.description).toBeTruthy()
  })

  it('has support phone config', () => {
    expect(siteConfig.supportPhoneDisplay).toBe('800-0000 (24/7)')
    expect(siteConfig.supportPhoneHref).toBe('tel:+9718000000')
  })

  it('has link groups', () => {
    expect(siteConfig.linkGroups).toBeDefined()
    expect(Array.isArray(siteConfig.linkGroups)).toBe(true)
    expect(siteConfig.linkGroups.length).toBeGreaterThan(0)
  })

  it('each link group has title and links', () => {
    siteConfig.linkGroups.forEach(group => {
      expect(group.title).toBeTruthy()
      expect(Array.isArray(group.links)).toBe(true)
      expect(group.links.length).toBeGreaterThan(0)
      
      group.links.forEach(link => {
        expect(link.label).toBeTruthy()
        expect(link.href).toBeTruthy()
      })
    })
  })

  it('has expected group titles', () => {
    const titles = siteConfig.linkGroups.map(g => g.title)
    expect(titles).toContain('Explore')
    expect(titles).toContain('Support')
    expect(titles).toContain('Company')
  })
})