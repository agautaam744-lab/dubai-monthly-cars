'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Car,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Lock,
  Apple,
  Loader2,
} from 'lucide-react'
import { completeMockPayment } from './actions'

type AddOn = {
  id: string
  quantity: number
  price_aed: number | string
  add_ons:
    | { name: string; price_type: string }
    | { name: string; price_type: string }[]
    | null
}

type Booking = {
  id: string
  status: string
  start_date: string
  duration_months: number
  delivery_type: string | null
  delivery_address: string | null
  monthly_price_aed: number | string
  deposit_aed: number | string
  total_add_ons_aed: number | string
  vehicles:
    | {
        id: string
        make: string
        model: string
        year: number | null
        category: string | null
        location: string | null
      }
    | {
        id: string
        make: string
        model: string
        year: number | null
        category: string | null
        location: string | null
      }[]
    | null
  pricing_tiers:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null
}

type Props = {
  booking: Booking
  addOns: AddOn[]
}

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

const paymentMethods = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'apple', label: 'Apple Pay', icon: Apple },
  { id: 'google', label: 'Google Pay', icon: Sparkles },
] as const

type MethodId = (typeof paymentMethods)[number]['id']

export default function PaymentForm({ booking, addOns }: Props) {
  const router = useRouter()

  const vehicle = Array.isArray(booking.vehicles)
    ? booking.vehicles[0]
    : booking.vehicles

  const tier = Array.isArray(booking.pricing_tiers)
    ? booking.pricing_tiers[0]
    : booking.pricing_tiers

  const [method, setMethod] = useState<MethodId>('card')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const monthlyRent = Number(booking.monthly_price_aed || 0)
  const deposit = Number(booking.deposit_aed || 0)
  const addOnTotal = Number(booking.total_add_ons_aed || 0)
  const total = monthlyRent + deposit + addOnTotal

  const handlePay = async () => {
    setSubmitting(true)
    setErrorMessage('')

    try {
      const result = await completeMockPayment(booking.id)

      if (!result.ok) {
        setErrorMessage(result.error ?? 'Payment failed. Please try again.')
        setSubmitting(false)
        return
      }

      router.push(`/bookings?paid=${booking.id}`)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unexpected error occurred.'
      )
      setSubmitting(false)
    }
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-[var(--muted-foreground)]">
          Vehicle details unavailable. Please contact support.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
            Secure Checkout
          </p>
          <h1 className="mt-2 text-3xl font-bold">Complete your payment</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Your booking will be confirmed instantly after payment.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                Booking ID
              </p>
              <p className="mt-1 font-mono text-sm font-semibold">
                {booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
              {tier?.name ?? 'Basic'} Plan
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-[var(--border)] pt-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--muted)]">
              <Car className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <div>
              <p className="font-semibold">
                {vehicle.make} {vehicle.model}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {vehicle.year ?? ''}
                {vehicle.category ? ` � ${vehicle.category}` : ''}
                {vehicle.location ? ` � ${vehicle.location}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Payment method
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            {paymentMethods.map((m) => {
              const Icon = m.icon
              const selected = method === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={[
                    'flex min-h-[88px] flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]'
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5 text-[var(--accent)]" />
                  <span className="text-sm font-semibold">{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {method === 'card' && (
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Cardholder name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Card number
              </label>
              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Expiry</label>
                <input
                  type="text"
                  placeholder="MM / YY"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">CVC</label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
            </div>

            <p className="flex items-center gap-2 rounded-xl bg-[var(--muted)] p-3 text-xs text-[var(--muted-foreground)]">
              <Lock className="h-3.5 w-3.5" />
              This is a demo payment form. No real card will be charged.
            </p>
          </div>
        )}

        {(method === 'apple' || method === 'google') && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              {method === 'apple' ? 'Apple Pay' : 'Google Pay'} will be available in production.
            </p>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              For now, please use the Card option.
            </p>
          </div>
        )}
      </div>

      <aside className="h-fit lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="bg-[var(--primary)] p-5 text-[var(--primary-foreground)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="font-semibold">Payment Summary</h2>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">First month rent</span>
              <span className="font-medium">{formatAED(monthlyRent)}</span>
            </div>

            {addOnTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Add-ons</span>
                <span className="font-medium">{formatAED(addOnTotal)}</span>
              </div>
            )}

            {addOns.length > 0 && (
              <div className="space-y-1.5 border-t border-dashed border-[var(--border)] pt-3">
                {addOns.map((a) => {
                  const info = Array.isArray(a.add_ons) ? a.add_ons[0] : a.add_ons
                  if (!info) return null
                  return (
                    <div key={a.id} className="flex justify-between text-xs text-[var(--muted-foreground)]">
                      <span>
                        {info.name}
                        {a.quantity > 1 ? ` � ${a.quantity}` : ''}
                        {info.price_type === 'monthly' ? ' /mo' : ''}
                      </span>
                      <span>{formatAED(Number(a.price_aed))}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Security deposit</span>
              <span className="font-medium">{formatAED(deposit)}</span>
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-dashed border-[var(--border)] pt-4">
              <span className="text-sm font-medium">Total due today</span>
              <span className="text-2xl font-bold">{formatAED(total)}</span>
            </div>

            <p className="text-xs text-[var(--muted-foreground)]">
              Refundable deposit will be returned at the end of your rental.
            </p>

            {errorMessage && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={submitting}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatAED(total)}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex gap-3 rounded-xl bg-[var(--success)]/10 p-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" />
              <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                Your payment is encrypted and processed securely. This is a demo payment for testing.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
