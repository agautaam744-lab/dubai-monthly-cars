import { CalendarDays, CarFront, ChevronRight, Clock3, MapPin, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusClass(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-500/10 text-blue-600'
    case 'active':
      return 'bg-green-500/10 text-green-600'
    case 'completed':
      return 'bg-slate-500/10 text-slate-600'
    case 'cancelled':
    case 'terminated':
      return 'bg-red-500/10 text-red-600'
    default:
      return 'bg-amber-500/10 text-amber-600'
  }
}

export default async function BookingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_date,
      end_date,
      duration_months,
      monthly_price_aed,
      deposit_aed,
      total_add_ons_aed,
      delivery_type,
      status,
      created_at,
      vehicles:vehicle_id (
        make,
        model,
        year,
        location
      ),
      pricing_tiers:tier_id (
        name
      )
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Customer Account
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            My Bookings
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Track your rental requests, dates, plan, delivery option and current booking status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const vehicle = Array.isArray(booking.vehicles)
                ? booking.vehicles[0]
                : booking.vehicles
              const tier = Array.isArray(booking.pricing_tiers)
                ? booking.pricing_tiers[0]
                : booking.pricing_tiers

              const firstPaymentEstimate =
                Number(booking.monthly_price_aed) +
                Number(booking.deposit_aed) +
                Number(booking.total_add_ons_aed ?? 0)

              return (
                <article
                  key={booking.id}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                        <CarFront className="h-6 w-6 text-[var(--accent)]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold">
                            {vehicle?.make ?? 'Vehicle'} {vehicle?.model ?? ''}
                          </h2>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(String(booking.status))}`}>
                            {statusLabel(String(booking.status))}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          Booking ID: {booking.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold">
                      {formatAED(Number(booking.monthly_price_aed))}
                      <span className="text-xs font-normal text-[var(--muted-foreground)]">/month</span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-[var(--muted)] p-4">
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <CalendarDays className="h-4 w-4" />
                        Start date
                      </div>
                      <p className="mt-2 font-semibold">{booking.start_date}</p>
                    </div>

                    <div className="rounded-2xl bg-[var(--muted)] p-4">
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <Clock3 className="h-4 w-4" />
                        Duration
                      </div>
                      <p className="mt-2 font-semibold">
                        {booking.duration_months} {booking.duration_months === 1 ? 'month' : 'months'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--muted)] p-4">
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <MapPin className="h-4 w-4" />
                        Delivery
                      </div>
                      <p className="mt-2 font-semibold">
                        {booking.delivery_type === 'home_delivery' ? 'Home delivery' : 'Pickup'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[var(--muted)] p-4">
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <ShieldCheck className="h-4 w-4" />
                        Plan
                      </div>
                      <p className="mt-2 font-semibold">
                        {tier?.name ?? 'Selected plan'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)]">Initial amount estimate</p>
                      <p className="mt-1 text-lg font-bold">{formatAED(firstPaymentEstimate)}</p>
                    </div>

                    <Link
                      href={`/dashboard?booking=${booking.id}`}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)]"
                    >
                      Open dashboard
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <CarFront className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
            <h2 className="mt-4 text-xl font-bold">No bookings yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
              Choose a car, complete KYC approval and create your first monthly rental booking.
            </p>
            <Link
              href="/cars"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)]"
            >
              Browse cars
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
