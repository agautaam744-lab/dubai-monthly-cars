import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending_kyc: {
      label: 'Pending KYC',
      className: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    },
    pending_agreement: {
      label: 'Pending Agreement',
      className: 'border-orange-500/20 bg-orange-500/10 text-orange-600',
    },
    pending_payment: {
      label: 'Pending Payment',
      className: 'border-sky-500/20 bg-sky-500/10 text-sky-600',
    },
    active: {
      label: 'Active',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    },
    completed: {
      label: 'Completed',
      className: 'border-gray-500/20 bg-gray-500/10 text-gray-600',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'border-red-500/20 bg-red-500/10 text-red-600',
    },
    terminated: {
      label: 'Terminated',
      className: 'border-red-500/20 bg-red-500/10 text-red-600',
    },
  }
  const config = map[status] ?? {
    label: status.replace(/_/g, ' '),
    className: 'border-gray-500/20 bg-gray-500/10 text-gray-600',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${config.className}`}
    >
      {config.label}
    </span>
  )
}

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      duration_months,
      delivery_type,
      monthly_price_aed,
      deposit_aed,
      total_add_ons_aed,
      agreement_signed_at,
      created_at,
      vehicles ( make, model, year, category ),
      pricing_tiers ( name )
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching bookings:', error)

  const allBookings = bookings ?? []
  const activeCount = allBookings.filter((b) => b.status === 'active').length
  const pendingCount = allBookings.filter((b) =>
    ['pending_kyc', 'pending_agreement', 'pending_payment'].includes(b.status)
  ).length
  const totalSpent = allBookings
    .filter((b) => b.status === 'active' || b.status === 'completed')
    .reduce(
      (sum, b) =>
        sum +
        Number(b.monthly_price_aed || 0) +
        Number(b.deposit_aed || 0) +
        Number(b.total_add_ons_aed || 0),
      0
    )

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Customer Account
          </p>

          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            My Bookings
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            Track your rental requests, dates, plans, and current booking status.
          </p>

          {/* STATS STRIP */}
          {allBookings.length > 0 && (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-4 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Active
                </p>
                <p className="mt-1 font-serif text-2xl tracking-tight tabular-nums">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-4 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Pending
                </p>
                <p className="mt-1 font-serif text-2xl tracking-tight tabular-nums">
                  {pendingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-4 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Total committed
                </p>
                <p className="mt-1 font-serif text-2xl tracking-tight tabular-nums">
                  {formatAED(totalSpent)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {allBookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/20">
              <Car className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-serif text-2xl tracking-tight">
              No bookings yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
              You haven&rsquo;t made any rental bookings yet. Browse the fleet and start your monthly plan.
            </p>
            <Link
              href="/cars"
              className="group mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Browse Cars
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {allBookings.map((booking) => {
              const vehicle = Array.isArray(booking.vehicles)
                ? booking.vehicles[0]
                : booking.vehicles
              const tier = Array.isArray(booking.pricing_tiers)
                ? booking.pricing_tiers[0]
                : booking.pricing_tiers

              if (!vehicle) return null

              const totalEstimate =
                Number(booking.monthly_price_aed || 0) +
                Number(booking.deposit_aed || 0) +
                Number(booking.total_add_ons_aed || 0)

              const needsAgreement =
                !booking.agreement_signed_at &&
                booking.status !== 'cancelled' &&
                booking.status !== 'active'

              return (
                <div
                  key={booking.id}
                  className="group overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5"
                >
                  <div className="p-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40">
                          <Car className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="truncate font-serif text-2xl tracking-tight">
                              {vehicle.make} {vehicle.model}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          <p className="mt-1.5 font-mono text-xs text-[var(--muted-foreground)]">
                            #{booking.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="font-serif text-2xl tracking-tight tabular-nums text-[var(--accent)]">
                          {formatAED(Number(booking.monthly_price_aed))}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          per month
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-6 sm:grid-cols-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                          <Calendar className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                          Start
                        </div>
                        <p className="mt-1.5 text-sm font-semibold">
                          {new Date(booking.start_date).toLocaleDateString('en-AE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                          <Clock className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                          Duration
                        </div>
                        <p className="mt-1.5 text-sm font-semibold">
                          {booking.duration_months} {booking.duration_months === 1 ? 'month' : 'months'}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                          <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                          Delivery
                        </div>
                        <p className="mt-1.5 text-sm font-semibold">
                          {booking.delivery_type === 'pickup' ? 'Pickup' : 'Home delivery'}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                          <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                          Plan
                        </div>
                        <p className="mt-1.5 text-sm font-semibold">
                          {tier?.name || 'Basic'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] bg-[var(--muted)]/30 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                          Initial amount
                        </p>
                        <p className="font-serif text-xl tracking-tight tabular-nums">
                          {formatAED(totalEstimate)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="group/btn inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
                        >
                          View Details
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5" aria-hidden="true" />
                        </Link>

                        {needsAgreement && (
                          <Link
                            href={`/agreement/${booking.id}`}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/5 px-4 text-sm font-semibold text-orange-600 transition-all hover:-translate-y-0.5 hover:bg-orange-500/10"
                          >
                            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                            Sign Agreement
                          </Link>
                        )}

                        {booking.status === 'pending_kyc' && (
                          <Link
                            href={`/kyc?next=/bookings`}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                          >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            Complete KYC
                          </Link>
                        )}

                        {booking.status === 'pending_payment' && (
                          <Link
                            href={`/payments?booking=${booking.id}`}
                            className="group/btn inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                          >
                            <CreditCard className="h-4 w-4" aria-hidden="true" />
                            Pay Now
                            <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5" aria-hidden="true" />
                          </Link>
                        )}

                        {booking.status === 'active' && (
                          <Link
                            href={`/dashboard`}
                            className="group/btn inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                          >
                            Open Dashboard
                            <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5" aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}