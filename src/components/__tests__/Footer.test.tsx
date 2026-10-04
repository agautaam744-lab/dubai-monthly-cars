import { render, screen } from '@testing-library/react'
import Footer from '@/components/layout/Footer'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/components/shared/ThemeProvider'

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

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Car: () => <svg data-testid="car-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
  Phone: () => <svg data-testid="phone-icon" />,
  MapPin: () => <svg data-testid="mappin-icon" />,
  Globe2: () => <svg data-testid="globe-icon" />,
  Send: () => <svg data-testid="send-icon" />,
  User: () => <svg data-testid="user-icon" />,
}))

function renderFooter() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <Footer />
      </LanguageProvider>
    </ThemeProvider>
  )
}

describe('Footer', () => {
  it('renders brand name', () => {
    renderFooter()
    expect(screen.getByText('Dubai Monthly Cars')).toBeInTheDocument()
  })

  it('renders support phone', () => {
    renderFooter()
    expect(screen.getByText('+971 4 333 4444')).toBeInTheDocument()
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
    expect(screen.getByLabelText('Instagram')).toHaveAttribute('href', 'https://instagram.com/dubaimonthlycars')
    expect(screen.getByLabelText('Twitter')).toHaveAttribute('href', 'https://twitter.com/dubaimonthlycar')
    expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('href', 'https://linkedin.com/company/dubai-monthly-cars')
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