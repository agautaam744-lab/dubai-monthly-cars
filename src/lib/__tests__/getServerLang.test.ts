import { getServerTranslation } from '@/lib/getServerLang'

// Mock next/headers cookies
const mockGet = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: mockGet,
  })),
}))

describe('getServerTranslation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns english by default when no cookie', async () => {
    mockGet.mockReturnValue(undefined)

    const result = await getServerTranslation()
    
    expect(result.lang).toBe('en')
    expect(typeof result.t).toBe('function')
  })

  it('returns arabic when cookie is set', async () => {
    mockGet.mockReturnValue({ value: 'ar' })

    const result = await getServerTranslation()
    
    expect(result.lang).toBe('ar')
    expect(typeof result.t).toBe('function')
  })

  it('t function returns key for missing translations', async () => {
    const result = await getServerTranslation()
    
    const missingKey = result.t('this.key.does.not.exist')
    expect(missingKey).toBe('this.key.does.not.exist')
  })
})