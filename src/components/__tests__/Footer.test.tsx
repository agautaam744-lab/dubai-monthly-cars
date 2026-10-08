import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Footer from '@/components/layout/Footer'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { siteConfig } from '@/lib/site'

// Mock window.matchMedia for next-themes (must be before render)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock lucide-react icons (must match Footer imports)
jest.mock('lucide-react', () => ({
  Car: () => <svg data-testid="car-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
  Phone: () => <svg data-testid="phone-icon" />,
  MapPin: () => <svg data-testid="mappin-icon" />,
  Globe: () => <svg data-testid="globe-icon" />,
  AtSign: () => <svg data-testid="atsign-icon" />,
  Briefcase: () => <svg data-testid="briefcase-icon" />,
}))

// next-themes touches window.matchMedia on mount; isolate Footer from it.
jest.mock('@/components/shared/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function renderFooter() {
  return render(
    <LanguageProvider>
      <Footer />
    </LanguageProvider>
  )
}

describe('Footer', () => {
  it('renders brand name', () => {
    renderFooter()
    expect(screen.getByText('Dubai Monthly Cars')).toBeInTheDocument()
  })

  it('renders support phone', () => {
    renderFooter()
    expect(screen.getByText('800-0000')).toBeInTheDocument()
    expect(screen.getByText('800-0000').closest('a')).toHaveAttribute('href', siteConfig.supportPhoneHref)
  })

  it('renders email', () => {
    renderFooter()
    expect(screen.getByText('support@dubaimonthlycars.ae')).toBeInTheDocument()
  })

  it('renders address', () => {
    renderFooter()
    expect(screen.getByText('Dubai, United Arab Emirates')).toBeInTheDocument()
  })

  it('renders social links', () => {
    renderFooter()
    expect(screen.getByLabelText('Instagram')).toHaveAttribute('href', 'https://instagram.com')
    expect(screen.getByLabelText('Twitter')).toHaveAttribute('href', 'https://twitter.com')
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('href', 'https://linkedin.com')
  })

  it('renders navigation sections', () => {
    renderFooter()
    expect(screen.getByText('Explore')).toBeInTheDocument()
    expect(screen.getByText('Legal')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders copyright', () => {
    renderFooter()
    const year = new Date().getFullYear()
    expect(screen.getByText(`${year} Dubai Monthly Cars. All rights reserved.`)).toBeInTheDocument()
  })

  it('renders made in UAE', () => {
    renderFooter()
    expect(screen.getByText('Made in UAE')).toBeInTheDocument()
  })
})