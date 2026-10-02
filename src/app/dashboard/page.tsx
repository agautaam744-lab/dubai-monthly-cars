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
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import InvoiceButton from '@/app/payments/InvoiceButton'

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
    { data: tripReports },
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
    supabase
      .from('condition_reports')
      .select('id, booking_id, type, mileage, created_at')
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const allBookings = bookings ?? []
  const allPayments = payments ?? []
  const allDocs = documents ?? []
  const allTripReports = tripReports ?? []

  const tripsByBooking = new Map<string, { pickup?: number; ret?: number; date: string }>()
  for (const r of allTripReports) {
    const entry = tripsByBooking.get(r.booking_id) ?? { date: String(r.created_at) }
    if (r.type === 'pickup' && r.mileage != null) entry.pickup = Number(r.mileage)
    if (r.type === 'return' && r.mileage != null) entry.ret = Number(r.mileage)
    if (String(r.created_at) > String(entry.date)) entry.date = r.created_at
    tripsByBooking.set(r.booking_id, entry)
  }

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

  const todayStr = new Date().toISOString().slice(0, 10)
  const overduePayments = pendingPayments.filter(
    (p) => p.due_date && String(p.due_date).slice(0, 10) < todayStr
  )
  const latePenalty = overduePayments.reduce(
    (sum, p) => sum + Math.round(Number(p.amount_aed || 0) * 0.05),
    0
  )

  const walletBalance = allPayments
    .filter(
      (p) =>
        p.status === 'succeeded' &&
        ['wallet_credit', 'refund', 'referral_payout'].includes(String(p.type))
    )
    .reduce((sum, p) => sum + Number(p.amount_aed || 0), 0)

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
        {/* CINEMATIC HEADER */}
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.14),transparent)]"
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8 lg:pb-14 lg:pt-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Customer Dashboard
                </p>
                <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
                  Welcome back, {displayName}
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--foreground)]/70 sm:text-base">
                  Manage your rentals, payments, and documents in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/cars"
                  className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl"
                >
                  <CarFront className="h-4 w-4" aria-hidden="true" />
                  Browse Cars
                </Link>
                <Link
                  href="/notifications"
                  className="relative inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-md"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  Notifications
                  {(unreadNotifications ?? 0) > 0 && (
                    <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* KPI CARDS */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CarFront className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Active rentals
                  </p>
                  <p className="mt-0.5 font-serif text-3xl tracking-tight tabular-nums">
                    {activeBookings.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Pending actions
                  </p>
                  <p className="mt-0.5 font-serif text-3xl tracking-tight tabular-nums">
                    {pendingBookings.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10">
                  <CreditCard className="h-5 w-5 text-sky-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Amount due
                  </p>
                  <p className="mt-0.5 font-serif text-2xl tracking-tight tabular-nums">
                    {formatAED(totalPending)}
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10">
                  <WalletCards className="h-5 w-5 text-purple-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Wallet
                  </p>
                  <p className="mt-0.5 font-serif text-2xl tracking-tight tabular-nums">
                    {formatAED(walletBalance)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:col-span-2 lg:col-span-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    kyc.status === 'approved'
                      ? 'bg-emerald-500/10'
                      : kyc.status === 'rejected'
                        ? 'bg-red-500/10'
                        : 'bg-amber-500/10'
                  }`}
                >
                  {kyc.status === 'approved' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                  ) : kyc.status === 'rejected' ? (
                    <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                    Verification status
                  </p>
                  <p className="mt-0.5 font-semibold">{kyc.label}</p>
                </div>
                <Link
                  href="/kyc"
                  className="hidden min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-medium transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)] sm:inline-flex"
                >
                  Manage
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* ALERTS */}
          {overduePayments.length > 0 && (
            <div className="mt-6 flex flex-col gap-4 overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {overduePayments.length} overdue payment{overduePayments.length > 1 ? 's' : ''} · {formatAED(latePenalty)} late penalty (5%)
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]/70">
                    Pay now to avoid service interruption. Penalty accrues at 5% of each overdue amount.
                  </p>
                </div>
              </div>
              {overduePayments[0].booking_id && (
                <Link
                  href={`/payments?booking=${overduePayments[0].booking_id}`}
                  className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 hover:opacity-90"
                >
                  Pay overdue
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              )}
            </div>
          )}

          {nextDue && overduePayments.length === 0 && (
            <div className="mt-6 flex flex-col gap-4 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    Payment due {formatDate(nextDue.due_date)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]/70">
                    {formatAED(Number(nextDue.amount_aed))} ·{' '}
                    {(nextDue.type || 'payment').replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              {nextDue.booking_id && (
                <Link
                  href={`/payments?booking=${nextDue.booking_id}`}
                  className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:opacity-90"
                >
                  Pay now
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
              )}
            </div>
          )}

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <div className="space-y-10 lg:col-span-2">
              {/* ACTIVE RENTALS */}
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-serif text-2xl tracking-tight">Active Rentals</h2>
                  <Link
                    href="/bookings"
                    className="group inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] transition hover:opacity-80"
                  >
                    View all
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                  </Link>
                </div>

                {activeBookings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5">
                      <CarFront className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
                    </div>
                    <p className="mt-4 font-semibold">No active rentals</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Browse the fleet and start your monthly plan.
                    </p>
                    <Link
                      href="/cars"
                      className="mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5"
                    >
                      Browse Cars
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
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
                          className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-lg"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate font-serif text-xl tracking-tight">
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
                                  <CalendarDays className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                                  {formatDate(booking.start_date)}
                                  {booking.end_date
                                    ? ` → ${formatDate(booking.end_date)}`
                                    : ` · ${booking.duration_months} mo`}
                                </span>
                                {vehicle?.location && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                                    {vehicle.location}
                                  </span>
                                )}
                                {mileageLimit != null && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Gauge className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                                    {mileageLimit.toLocaleString()} km/month
                                    {currentMileage != null
                                      ? ` · odo ${currentMileage.toLocaleString()} km`
                                      : ''}
                                  </span>
                                )}
                              </div>
                              {mileageLimit != null && (
                                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                                  Track usage via pickup/return condition reports. Alerts trigger near 80% of the monthly cap.
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                              <p className="text-lg font-bold tabular-nums">
                                {formatAED(Number(booking.monthly_price_aed))}
                                <span className="text-xs font-normal text-[var(--muted-foreground)]"> /mo</span>
                              </p>
                              <ChevronRight className="h-5 w-5 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* ACTION REQUIRED */}
              {pendingBookings.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="font-serif text-2xl tracking-tight">Action Required</h2>
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
                          className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:border-[var(--accent)]/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
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
                            className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                          >
                            {ctaLabel}
                            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* PAST RENTALS */}
              {pastBookings.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="font-serif text-2xl tracking-tight">Past Rentals</h2>
                  </div>
                  <div className="space-y-2">
                    {pastBookings.slice(0, 5).map((booking) => {
                      const vehicle = Array.isArray(booking.vehicles)
                        ? booking.vehicles[0]
                        : booking.vehicles

                      return (
                        <Link
                          key={booking.id}
                          href={`/bookings/${booking.id}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3.5 transition hover:border-[var(--accent)]/40 hover:bg-[var(--muted)]/50"
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
                            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] rtl:rotate-180" aria-hidden="true" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* TRIP & MILEAGE */}
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-serif text-2xl tracking-tight">Trip &amp; Mileage History</h2>
                  <Link
                    href="/condition-report"
                    className="text-sm font-semibold text-[var(--accent)] hover:opacity-80"
                  >
                    Reports
                  </Link>
                </div>
                {tripsByBooking.size === 0 ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted-foreground)]">
                    No mileage logs yet. Odometer readings from pickup and return condition reports appear here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from(tripsByBooking.entries()).slice(0, 5).map(([bookingId, t]) => {
                      const driven = t.pickup != null && t.ret != null ? t.ret - t.pickup : null
                      return (
                        <div
                          key={bookingId}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3.5 transition hover:border-[var(--accent)]/40"
                        >
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-sm font-semibold">
                              <Gauge className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                              {driven != null && driven >= 0
                                ? `${driven.toLocaleString()} km driven`
                                : 'Mileage logged'}
                            </p>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                              {t.pickup != null ? `Out ${t.pickup.toLocaleString()} km` : 'Out —'}
                              {' · '}
                              {t.ret != null ? `In ${t.ret.toLocaleString()} km` : 'In —'}
                              {' · '}
                              {formatDate(t.date)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-10">
              <section>
                <div className="mb-5">
                  <h2 className="font-serif text-2xl tracking-tight">Upcoming Payments</h2>
                </div>
                {upcomingDue.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted-foreground)]">
                    No upcoming payments.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingDue.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3.5 transition hover:border-[var(--accent)]/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold tabular-nums">
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
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-serif text-2xl tracking-tight">Payment History</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Paid {formatAED(totalPaid)}
                  </p>
                </div>
                {succeededPayments.length === 0 &&
                failedPayments.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted-foreground)]">
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
                          className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3.5 transition hover:border-[var(--accent)]/40"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold tabular-nums">
                              {formatAED(Number(p.amount_aed))}
                            </p>
                            <p className="truncate text-xs text-[var(--muted-foreground)]">
                              {(p.type || 'payment').replace(/_/g, ' ')}
                              {p.paid_at
                                ? ` · ${formatDate(p.paid_at)}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {p.status === 'succeeded' && <InvoiceButton paymentId={p.id} />}
                            {paymentStatusBadge(p.status)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-5 font-serif text-2xl tracking-tight">Quick Actions</h2>
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
                      className="group flex min-h-[56px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md"
                    >
                      <item.icon className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {item.desc}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
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