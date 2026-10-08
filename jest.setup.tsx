import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock window.matchMedia for next-themes
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

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}))

// Mock Server Actions
jest.mock('@/app/payments/actions', () => ({
  completePayment: jest.fn(),
  completeMockPayment: jest.fn(),
  createPaymentSession: jest.fn(),
}))

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue({
    elements: jest.fn(),
    confirmPayment: jest.fn(),
  }),
}))

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
  useStripe: () => ({
    confirmPayment: jest.fn().mockResolvedValue({ error: null }),
  }),
  useElements: () => ({
    submit: jest.fn(),
  }),
  PaymentElement: () => <div data-testid="payment-element" />,
}))

// Mock next/font
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
    variable: '--font-inter',
  }),
}))

// Suppress console errors in tests (optional)
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) return
    originalError.call(console, ...args)
  }
})
afterAll(() => {
  console.error = originalError
})