import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ChevronLeft,
  Car,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock3,
  Sparkles,
  Gauge,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ManageSubscription from './ManageSubscription'
import RoadsideButton from '@/app/support/RoadsideButton'

type Props = {
  params: Promise<{ id: string }>
}

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

function statusBadge(status: string) {
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
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${config.className}`}
    >
      {config.label}
    </span>
  )
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/bookings/${id}`)

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      end_date,
      duration_months,
      monthly_price_aed,
      deposit_aed,
      total_add_ons_aed,
      auto_renew,
      agreement_signed_at,
      created_at,
      vehicles ( make, model, year, plate_number ),
      pricing_tiers ( name, mileage_limit_km )
    `)
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!booking) notFound()

  const vehicle = Array.isArray(booking.vehicles) ? booking.vehicles[0] : booking.vehicles
  const tier = Array.isArray(booking.pricing_tiers) ? booking.pricing_tiers[0] : booking.pricing_tiers

  const total =
    Number(booking.monthly_price_aed || 0) +
    Number(booking.deposit_aed || 0) +
    Number(booking.total_add_ons_aed || 0)

  // Timeline steps
  const timeline = [
    { label: 'Booking created', date: booking.created_at, done: true },
    { label: 'KYC verification', date: null, done: booking.status !== 'pending_kyc' },
    { label: 'Agreement signed', date: booking.agreement_signed_at, done: !!booking.agreement_signed_at },
    { label: 'Payment confirmed', date: null, done: ['active', 'completed'].includes(booking.status) },
    { label: 'Active rental', date: booking.start_date, done: booking.status === 'active' || booking.status === 'completed' },
  ]

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-14 lg:px-8 lg:pb-14 lg:pt-16">
          <Link
            href="/bookings"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--accent)]"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            Back to My Bookings
          </Link>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Booking Details
              </p>
              <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
                {vehicle?.make} {vehicle?.model}
              </h1>
              <p className="mt-3 font-mono text-sm text-[var(--muted-foreground)]">
                #{booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="shrink-0">{statusBadge(booking.status)}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* VEHICLE */}
          <div className="group rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <Car className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg tracking-tight">Vehicle</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted-foreground)]">Car</dt>
                <dd className="font-semibold">{vehicle?.make} {vehicle?.model} {vehicle?.year ? `(${vehicle.year})` : ''}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted-foreground)]">Plate</dt>
                <dd className="font-mono font-semibold">{vehicle?.plate_number ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--muted-foreground)]">Plan</dt>
                <dd className="font-semibold">{tier?.name ?? 'Basic'}</dd>
              </div>
            </dl>
          </div>

          {/* RENTAL PERIOD */}
          <div className="group rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <Calendar className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg tracking-tight">Rental Period</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted-foreground)]">Start</dt>
                <dd className="font-semibold">
                  {new Date(booking.start_date).toLocaleDateString('en-AE', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted-foreground)]">Duration</dt>
                <dd className="font-semibold">
                  {booking.duration_months} month{booking.duration_months > 1 ? 's' : ''}
                </dd>
              </div>
              {tier?.mileage_limit_km ? (
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--muted-foreground)]">Mileage cap</dt>
                  <dd className="inline-flex items-center gap-1.5 font-semibold">
                    <Gauge className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                    {Number(tier.mileage_limit_km).toLocaleString()} km/mo
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {/* PAYMENT */}
          <div className="group rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <CreditCard className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg tracking-tight">Payment</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted-foreground)]">Monthly rent</dt>
                <dd className="font-semibold tabular-nums">{formatAED(Number(booking.monthly_price_aed))}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted-foreground)]">Security deposit</dt>
                <dd className="font-semibold tabular-nums">{formatAED(Number(booking.deposit_aed))}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <dt className="text-[var(--muted-foreground)]">Add-ons</dt>
                <dd className="font-semibold tabular-nums">{formatAED(Number(booking.total_add_ons_aed))}</dd>
              </div>
              <div className="flex items-center justify-between pt-1">
                <dt className="font-serif text-base">Total</dt>
                <dd className="font-serif text-xl tabular-nums text-[var(--accent)]">{formatAED(total)}</dd>
              </div>
            </dl>
          </div>

          {/* TIMELINE */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <Clock3 className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg tracking-tight">Progress</h2>
            </div>
            <ol className="space-y-4">
              {timeline.map((step, idx) => (
                <li key={step.label} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                      step.done
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                        : 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${step.done ? '' : 'text-[var(--muted-foreground)]'}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {new Date(step.date).toLocaleDateString('en-AE', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* AGREEMENT */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 lg:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <FileText className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg tracking-tight">Rental Agreement</h2>
            </div>
            {booking.agreement_signed_at ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Signed
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--foreground)]/70">
                    {new Date(booking.agreement_signed_at).toLocaleDateString('en-AE', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-orange-700">
                    Not signed yet
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--foreground)]/70">
                    You will be prompted to sign before the rental starts.
                  </p>
                </div>
              </div>
            )}
          </div>

          <ManageSubscription
            bookingId={booking.id}
            autoRenew={(booking as { auto_renew?: boolean }).auto_renew ?? false}
            status={booking.status}
          />

          <div className="lg:col-span-2">
            <RoadsideButton bookingId={booking.id} />
          </div>
        </div>
      </section>
    </main>
  )
}