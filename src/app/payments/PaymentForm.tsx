'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  Car,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Lock,
  Smartphone,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { completePayment } from './actions'

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
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, tag: 'Visa Mastercard' },
  { id: 'apple', label: 'Apple Pay', icon: Smartphone, tag: 'One-tap' },
  { id: 'google', label: 'Google Pay', icon: Sparkles, tag: 'One-tap' },
] as const

type MethodId = (typeof paymentMethods)[number]['id']

// Stripe promise - load once
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

function CardForm({
  onComplete,
  onError,
}: {
  onComplete: () => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      onError('Stripe not loaded. Please refresh and try again.')
      return
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bookings?paid=success`,
      },
    })

    if (error) {
      onError(error.message || 'Payment failed. Please try again.')
    } else {
      onComplete()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div>
        <label className="mb-2 block text-sm font-medium">
          Cardholder name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Card details
        </label>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          <PaymentElement />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 p-3">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">
          Your payment is encrypted and processed securely via Stripe.
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe}
        className="group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl hover:shadow-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <span>Pay</span>
        <ChevronRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
      </button>
    </form>
  )
}

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
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripeLoaded, setStripeLoaded] = useState(false)

  const monthlyRent = Number(booking.monthly_price_aed || 0)
  const deposit = Number(booking.deposit_aed || 0)
  const addOnTotal = Number(booking.total_add_ons_aed || 0)
  const total = monthlyRent + deposit + addOnTotal

  // Load Stripe on mount
  useEffect(() => {
    stripePromise.then((stripe) => {
      if (stripe) {
        setStripeLoaded(true)
      } else {
        setErrorMessage('Failed to load payment system. Please refresh.')
      }
    })
  }, [])

  // Fetch client secret for the selected provider (amount is recomputed server-side).
  const fetchClientSecret = useCallback(async (provider: 'stripe' | 'apple_pay' | 'google_pay' = 'stripe') => {
    if (clientSecret) return

    setSubmitting(true)
    setErrorMessage('')

    try {
      const result = await completePayment(booking.id, {
        provider,
        amountAed: total,
        returnUrl: `${window.location.origin}/bookings?paid=success`,
      })

      if (!result.ok) {
        setErrorMessage(result.error || 'Failed to initialize payment.')
        setSubmitting(false)
        return
      }

      if (result.clientSecret) {
        setClientSecret(result.clientSecret)
      } else if (result.url) {
        // Redirect for redirect-based payments
        window.location.href = result.url
        return
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }, [booking.id, total, clientSecret])

  // Fetch client secret when user selects a payment method
  useEffect(() => {
    if (!clientSecret) {
      if (method === 'card') fetchClientSecret('stripe')
      else if (method === 'apple') fetchClientSecret('apple_pay')
      else if (method === 'google') fetchClientSecret('google_pay')
    }
  }, [method, fetchClientSecret, clientSecret])

  const handlePay = async () => {
    if (method === 'apple') {
      await fetchClientSecret('apple_pay')
      return
    }
    if (method === 'google') {
      await fetchClientSecret('google_pay')
      return
    }

    // Card payment is handled by CardForm submit
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Secure Checkout
          </p>

          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            Complete your payment
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            Your booking will be confirmed instantly after payment.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 lg:px-8 lg:py-14">
        <div className="space-y-8">
          {/* BOOKING SUMMARY CARD */}
          <div className="group rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--accent)]/40 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Booking reference
                </p>
                <p className="mt-1.5 font-mono text-sm font-semibold">
                  #{booking.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 text-[11px] font-semibold text-[var(--accent)]">
                {tier?.name ?? 'Basic'} Plan
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4 border-t border-[var(--border)] pt-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40">
                <Car className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-xl tracking-tight">
                  {vehicle.make} {vehicle.model}
                </p>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                  {vehicle.year ?? ''}
                  {vehicle.category ? ` · ${vehicle.category}` : ''}
                  {vehicle.location ? ` · ${vehicle.location}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div>
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Step 1
              </p>
              <h2 className="mt-2 font-serif text-2xl tracking-tight">
                Payment method
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {paymentMethods.map((m) => {
                const Icon = m.icon
                const selected = method === m.id
                const disabled = (m.id === 'apple' || m.id === 'google') && !stripeLoaded
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => !disabled && setMethod(m.id)}
                    disabled={disabled}
                    className={[
                      'group/m relative flex min-h-[110px] flex-col items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                      disabled
                        ? 'opacity-50 cursor-not-allowed border-[var(--border)] bg-[var(--card)]'
                        : selected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md shadow-[var(--accent)]/10'
                        : 'border-[var(--border)] bg-[var(--card)] hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-md',
                    ].join(' ')}
                  >
                    {selected && (
                      <span className="absolute end-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    )}
                    <Icon className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        {m.label}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                        {m.tag}
                      </p>
                    </div>
                    {(m.id === 'apple' || m.id === 'google') && !stripeLoaded && (
                      <span className="absolute bottom-3 right-3 text-[10px] text-[var(--muted-foreground)]">
                        Loading...
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* CARD FORM - Stripe Elements */}
          {method === 'card' && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CardForm
                onComplete={() => router.push(`/bookings?paid=${booking.id}`)}
                onError={(error) => setErrorMessage(error)}
              />
            </Elements>
          )}

          {method === 'card' && !clientSecret && (
            <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center gap-3 text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)] mx-auto" aria-hidden="true" />
                <p className="text-[var(--muted-foreground)]">
                  Loading secure payment form...
                </p>
              </div>
            </div>
          )}

          {(method === 'apple' || method === 'google') && (
            <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40 p-8 text-center">
              <p className="font-serif text-lg tracking-tight text-[var(--foreground)]">
                {method === 'apple' ? 'Apple Pay' : 'Google Pay'}
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Redirecting to {method === 'apple' ? 'Apple Pay' : 'Google Pay'}...
              </p>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
            <div className="relative bg-gradient-to-br from-[var(--primary)] to-black p-5 text-white">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(201,162,39,0.25),transparent)]"
              />
              <div className="relative flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                <h2 className="font-serif text-lg tracking-tight">
                  Payment Summary
                </h2>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">
                  First month rent
                </span>
                <span className="font-medium tabular-nums">
                  {formatAED(monthlyRent)}
                </span>
              </div>

              {addOnTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Add-ons</span>
                  <span className="font-medium tabular-nums">
                    {formatAED(addOnTotal)}
                  </span>
                </div>
              )}

              {addOns.length > 0 && (
                <div className="space-y-2 border-t border-dashed border-[var(--border)] pt-3">
                  {addOns.map((a) => {
                    const info = Array.isArray(a.add_ons) ? a.add_ons[0] : a.add_ons
                    if (!info) return null
                    return (
                      <div
                        key={a.id}
                        className="flex justify-between text-xs text-[var(--muted-foreground)]"
                      >
                        <span>
                          {info.name}
                          {a.quantity > 1 ? ` × ${a.quantity}` : ''}
                          {info.price_type === 'monthly' ? ' /mo' : ''}
                        </span>
                        <span className="tabular-nums">
                          {formatAED(Number(a.price_aed))}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex justify-between border-t border-[var(--border)] pt-4 text-sm">
                <span className="text-[var(--muted-foreground)]">
                  Security deposit
                </span>
                <span className="font-medium tabular-nums">
                  {formatAED(deposit)}
                </span>
              </div>

              <div className="mt-2 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                      Total due today
                    </p>
                    <p className="mt-1 font-serif text-3xl tracking-tight tabular-nums text-[var(--accent)]">
                      {formatAED(total)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                Refundable deposit will be returned at the end of your rental.
              </p>

              {errorMessage && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={submitting || (method === 'card' && !clientSecret)}
                className="group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl hover:shadow-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {formatAED(total)}
                    <ChevronRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>

              <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <p className="text-xs leading-5 text-[var(--foreground)]/70">
                  Your payment is encrypted and processed securely via Stripe.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}