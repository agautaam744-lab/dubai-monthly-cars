import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  CalendarDays,
  CarFront,
  FileCheck2,
  WalletCards,
  CreditCard,
  Clock,
  MapPin,
  Gauge,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowRight,
  Bell,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    pending_kyc: {
      label: 'Pending KYC',
      className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    },
    pending_agreement: {
      label: 'Pending Agreement',
      className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    pending_payment: {
      label: 'Pending Payment',
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    active: {
      label: 'Active',
      className: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    completed: {
      label: 'Completed',
      className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    terminated: {
      label: 'Terminated',
      className: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
  }

  const config = map[status] ?? {
    label: status.replace(/_/g, ' '),
    className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  )
}

function paymentStatusBadge(status: string) {
  if (status === 'succeeded') {
    return (
      <span className="inline-flex rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
        Paid
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
        Due
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
        Failed
      </span>
    )
  }
  if (status === 'refunded') {
    return (
      <span className="inline-flex rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
        Refunded
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
      {status}
    </span>
  )
}

function kycSummary(
  docs: { type: string; status: string }[]
): {
  status: 'approved' | 'pending' | 'rejected' | 'incomplete'
  label: string
} {
  const required = ['emirates_id', 'driving_license', 'passport']
  const latest = new Map<string, string>()

  for (const doc of docs) {
    if (!latest.has(doc.type)) {
      latest.set(doc.type, doc.status)
    }
  }

  const statuses = required.map((t) => latest.get(t) ?? 'missing')
  const approved = statuses.filter((s) => s === 'approved').length
  const rejected = statuses.filter((s) => s === 'rejected').length
  const pending = statuses.filter((s) => s === 'pending').length

  if (approved === required.length) {
    return { status: 'approved', label: 'KYC Approved' }
  }
  if (rejected > 0) {
    return { status: 'rejected', label: 'KYC Rejected' }
  }
  if (pending > 0 || approved > 0) {
    return { status: 'pending', label: 'KYC In Review' }
  }
  return { status: 'incomplete', label: 'KYC Required' }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  const [
    { data: profile },
    { data: bookings },
    { data: payments },
    { data: documents },
    { count: unreadNotifications },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .single(),
    supabase
      .from('bookings')
      .select(
        `
        id,
        status,
        start_date,
        end_date,
        duration_months,
        delivery_type,
        delivery_address,
        monthly_price_aed,
        deposit_aed,
        total_add_ons_aed,
        agreement_signed_at,
        created_at,
        vehicles (
          id,
          make,
          model,
          year,
          category,
          location,
          current_mileage,
          plate_number,
          status
        ),
        pricing_tiers (
          id,
          name,
          mileage_limit_km,
          insurance_level
        )
      `
      )
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select(
        `
        id,
        booking_id,
        amount_aed,
        type,
        status,
        provider,
        paid_at,
        due_date,
        created_at
      `
      )
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('documents')
      .select('type, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
  ])

  const allBookings = bookings ?? []
  const allPayments = payments ?? []
  const allDocs = documents ?? []

  const activeBookings = allBookings.filter((b) => b.status === 'active')
  const pendingBookings = allBookings.filter((b) =>
    ['pending_kyc', 'pending_agreement', 'pending_payment'].includes(b.status)
  )
  const pastBookings = allBookings.filter((b) =>
    ['completed', 'cancelled', 'terminated'].includes(b.status)
  )

  const pendingPayments = allPayments.filter((p) => p.status === 'pending')
  const succeededPayments = allPayments.filter((p) => p.status === 'succeeded')
  const failedPayments = allPayments.filter((p) => p.status === 'failed')

  const upcomingDue = pendingPayments
    .filter((p) => p.due_date)
    .sort(
      (a, b) =>
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
    )
    .slice(0, 5)

  const nextDue = upcomingDue[0] ?? null
  const totalPaid = succeededPayments.reduce(
    (sum, p) => sum + Number(p.amount_aed || 0),
    0
  )
  const totalPending = pendingPayments.reduce(
    (sum, p) => sum + Number(p.amount_aed || 0),
    0
  )

  const kyc = kycSummary(allDocs)
  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split('@')[0] ||
    user.phone ||
    'there'

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-[var(--border)] bg-[var(--muted)]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Customer Dashboard
                </p>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Welcome back, {displayName}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Manage your rentals, payments, and documents in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/cars"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <CarFront className="h-4 w-4" />
                  Browse Cars
                </Link>
                <Link
                  href="/notifications"
                  className="relative inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--muted)]"
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                  {(unreadNotifications ?? 0) > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                  <CarFront className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Active Rentals
                  </p>
                  <p className="text-2xl font-bold">{activeBookings.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Pending Actions
                  </p>
                  <p className="text-2xl font-bold">{pendingBookings.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Amount Due
                  </p>
                  <p className="text-2xl font-bold">
                    {formatAED(totalPending)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    kyc.status === 'approved'
                      ? 'bg-green-500/10'
                      : kyc.status === 'rejected'
                        ? 'bg-red-500/10'
                        : 'bg-yellow-500/10'
                  }`}
                >
                  {kyc.status === 'approved' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : kyc.status === 'rejected' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Verification
                  </p>
                  <p className="text-sm font-bold leading-tight">{kyc.label}</p>
                </div>
              </div>
            </div>
          </div>

          {nextDue && (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Payment due {formatDate(nextDue.due_date)}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                    {formatAED(Number(nextDue.amount_aed))} ·{' '}
                    {(nextDue.type || 'payment').replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              {nextDue.booking_id && (
                <Link
                  href={`/payments?booking=${nextDue.booking_id}`}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Pay now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Active Rentals</h2>
                  <Link
                    href="/bookings"
                    className="text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    View all
                  </Link>
                </div>

                {activeBookings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
                    <CarFront className="mx-auto h-10 w-10 text-[var(--muted-foreground)]" />
                    <p className="mt-3 font-medium">No active rentals</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Browse the fleet and start your monthly plan.
                    </p>
                    <Link
                      href="/cars"
                      className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Browse Cars
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBookings.map((booking) => {
                      const vehicle = Array.isArray(booking.vehicles)
                        ? booking.vehicles[0]
                        : booking.vehicles
                      const tier = Array.isArray(booking.pricing_tiers)
                        ? booking.pricing_tiers[0]
                        : booking.pricing_tiers
                      const mileageLimit = tier?.mileage_limit_km ?? null
                      const currentMileage = vehicle?.current_mileage ?? null

                      return (
                        <Link
                          key={booking.id}
                          href={`/bookings/${booking.id}`}
                          className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-semibold">
                                  {vehicle
                                    ? `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ''}`
                                    : 'Vehicle'}
                                </h3>
                                {statusBadge(booking.status)}
                              </div>

                              {tier?.name && (
                                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                  {tier.name} plan
                                  {tier.insurance_level
                                    ? ` · ${tier.insurance_level} insurance`
                                    : ''}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted-foreground)]">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {formatDate(booking.start_date)}
                                  {booking.end_date
                                    ? ` → ${formatDate(booking.end_date)}`
                                    : ` · ${booking.duration_months} mo`}
                                </span>
                                {vehicle?.location && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {vehicle.location}
                                  </span>
                                )}
                                {mileageLimit != null && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Gauge className="h-3.5 w-3.5" />
                                    {mileageLimit.toLocaleString()} km/month
                                    {currentMileage != null
                                      ? ` · odo ${currentMileage.toLocaleString()}`
                                      : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                              <p className="text-lg font-bold">
                                {formatAED(Number(booking.monthly_price_aed))}
                                <span className="text-xs font-normal text-[var(--muted-foreground)]">
                                  /mo
                                </span>
                              </p>
                              <ChevronRight className="h-5 w-5 text-[var(--muted-foreground)]" />
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>

              {pendingBookings.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Action Required</h2>
                  </div>
                  <div className="space-y-3">
                    {pendingBookings.map((booking) => {
                      const vehicle = Array.isArray(booking.vehicles)
                        ? booking.vehicles[0]
                        : booking.vehicles

                      let ctaHref = `/bookings/${booking.id}`
                      let ctaLabel = 'Continue'
                      if (booking.status === 'pending_kyc') {
                        ctaHref = '/kyc'
                        ctaLabel = 'Complete KYC'
                      } else if (booking.status === 'pending_agreement') {
                        ctaHref = `/agreement/${booking.id}`
                        ctaLabel = 'Sign Agreement'
                      } else if (booking.status === 'pending_payment') {
                        ctaHref = `/payments?booking=${booking.id}`
                        ctaLabel = 'Pay Deposit'
                      }

                      return (
                        <div
                          key={booking.id}
                          className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">
                                {vehicle
                                  ? `${vehicle.make} ${vehicle.model}`
                                  : 'Booking'}
                              </p>
                              {statusBadge(booking.status)}
                            </div>
                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                              Starts {formatDate(booking.start_date)} ·{' '}
                              {formatAED(Number(booking.monthly_price_aed))}/mo
                            </p>
                          </div>
                          <Link
                            href={ctaHref}
                            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                          >
                            {ctaLabel}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {pastBookings.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Past Rentals</h2>
                  </div>
                  <div className="space-y-3">
                    {pastBookings.slice(0, 5).map((booking) => {
                      const vehicle = Array.isArray(booking.vehicles)
                        ? booking.vehicles[0]
                        : booking.vehicles

                      return (
                        <Link
                          key={booking.id}
                          href={`/bookings/${booking.id}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition hover:bg-[var(--muted)]"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {vehicle
                                ? `${vehicle.make} ${vehicle.model}`
                                : 'Vehicle'}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {formatDate(booking.start_date)}
                              {booking.end_date
                                ? ` – ${formatDate(booking.end_date)}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusBadge(booking.status)}
                            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-8">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Upcoming Payments</h2>
                </div>
                {upcomingDue.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted-foreground)]">
                    No upcoming payments.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingDue.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">
                            {formatAED(Number(p.amount_aed))}
                          </p>
                          {paymentStatusBadge(p.status)}
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {(p.type || 'payment').replace(/_/g, ' ')} · Due{' '}
                          {formatDate(p.due_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Payment History</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Total paid {formatAED(totalPaid)}
                  </p>
                </div>
                {succeededPayments.length === 0 &&
                failedPayments.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted-foreground)]">
                    No payments yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...succeededPayments, ...failedPayments]
                      .sort(
                        (a, b) =>
                          new Date(b.paid_at || b.created_at).getTime() -
                          new Date(a.paid_at || a.created_at).getTime()
                      )
                      .slice(0, 8)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">
                              {formatAED(Number(p.amount_aed))}
                            </p>
                            <p className="truncate text-xs text-[var(--muted-foreground)]">
                              {(p.type || 'payment').replace(/_/g, ' ')}
                              {p.paid_at
                                ? ` · ${formatDate(p.paid_at)}`
                                : ''}
                            </p>
                          </div>
                          {paymentStatusBadge(p.status)}
                        </div>
                      ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-4 text-lg font-bold">Quick Actions</h2>
                <div className="grid gap-2">
                  {[
                    {
                      href: '/kyc',
                      icon: FileCheck2,
                      label: 'KYC Documents',
                      desc: kyc.label,
                    },
                    {
                      href: '/bookings',
                      icon: CalendarDays,
                      label: 'My Bookings',
                      desc: `${allBookings.length} total`,
                    },
                    {
                      href: '/condition-report',
                      icon: ShieldCheck,
                      label: 'Condition Report',
                      desc: 'Pickup / return photos',
                    },
                    {
                      href: '/damage-report',
                      icon: AlertCircle,
                      label: 'Damage Report',
                      desc: 'Report an issue',
                    },
                    {
                      href: '/support',
                      icon: WalletCards,
                      label: 'Support',
                      desc: 'Tickets & help',
                    },
                    {
                      href: '/profile',
                      icon: FileCheck2,
                      label: 'Profile',
                      desc: 'Account settings',
                    },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex min-h-[48px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition hover:bg-[var(--muted)]"
                    >
                      <item.icon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {item.desc}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
