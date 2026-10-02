import {
  CalendarCheck,
  Car,
  DollarSign,
  FileCheck,
  AlertCircle,
  TrendingUp,
  Users,
  ShieldAlert,
  ShieldCheck,
  FileWarning,
} from 'lucide-react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import type { BookingRow } from '@/types/database'
import { first } from '@/types/database'

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  const ms = new Date(dateStr).getTime() - new Date().getTime()
  return Math.ceil(ms / 86400000)
}

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin()

  // Active rentals count
  const { count: activeRentals } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Available vehicles count
  const { count: availableVehicles } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')

  // Total vehicles
  const { count: totalVehicles } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })

  // Pending KYC documents
  const { count: pendingKyc } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Monthly revenue
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: paymentsThisMonth } = await supabase
    .from('payments')
    .select('amount_aed')
    .eq('status', 'succeeded')
    .gte('paid_at', startOfMonth.toISOString())

  const monthlyRevenue = (paymentsThisMonth ?? []).reduce(
    (sum, p) => sum + Number(p.amount_aed || 0),
    0
  )

  // Pending payments
  const { count: pendingPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Recent bookings
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      monthly_price_aed,
      created_at,
      vehicles ( make, model ),
      profiles:customer_id ( full_name, email )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // Total customers
  const { count: totalCustomers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')

  // ============================================
  // COMPLIANCE ALERTS
  // ============================================
  const today = new Date().toISOString().slice(0, 10)
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)

  const { data: complianceVehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year, plate_number, insurance_expiry, insurance_provider, registration_expiry, status')
    .in('status', ['available', 'rented', 'maintenance'])
    .or(`insurance_expiry.lte.${in60},registration_expiry.lte.${in60}`)
    .order('insurance_expiry', { ascending: true, nullsFirst: false })

  const complianceIssues = (complianceVehicles ?? []).map((v) => {
    const insDays = daysUntil(v.insurance_expiry)
    const regDays = daysUntil(v.registration_expiry)

    const insStatus: 'expired' | 'critical' | 'warning' | 'ok' =
      insDays === null ? 'ok' : insDays < 0 ? 'expired' : insDays <= 30 ? 'critical' : insDays <= 60 ? 'warning' : 'ok'
    const regStatus: 'expired' | 'critical' | 'warning' | 'ok' =
      regDays === null ? 'ok' : regDays < 0 ? 'expired' : regDays <= 30 ? 'critical' : regDays <= 60 ? 'warning' : 'ok'

    return { ...v, insDays, regDays, insStatus, regStatus }
  })

  const expiredCount = complianceIssues.filter(
    (v) => v.insStatus === 'expired' || v.regStatus === 'expired'
  ).length
  const criticalCount = complianceIssues.filter(
    (v) =>
      v.insStatus === 'critical' ||
      v.regStatus === 'critical' ||
      v.insStatus === 'expired' ||
      v.regStatus === 'expired'
  ).length
  const totalComplianceAlerts = complianceIssues.length

  const stats = [
    {
      label: 'Active Rentals',
      value: activeRentals ?? 0,
      icon: CalendarCheck,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      label: 'Available Fleet',
      value: `${availableVehicles ?? 0} / ${totalVehicles ?? 0}`,
      icon: Car,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Monthly Revenue',
      value: formatAED(monthlyRevenue),
      icon: DollarSign,
      color: 'text-[var(--accent)] bg-[var(--accent)]/10',
    },
    {
      label: 'Pending KYC',
      value: pendingKyc ?? 0,
      icon: FileCheck,
      color: 'text-yellow-500 bg-yellow-500/10',
    },
    {
      label: 'Pending Payments',
      value: pendingPayments ?? 0,
      icon: AlertCircle,
      color: 'text-red-500 bg-red-500/10',
    },
    {
      label: 'Total Customers',
      value: totalCustomers ?? 0,
      icon: Users,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      label: 'Compliance Alerts',
      value: totalComplianceAlerts,
      icon: ShieldAlert,
      color:
        expiredCount > 0
          ? 'text-red-500 bg-red-500/10'
          : criticalCount > 0
            ? 'text-orange-500 bg-orange-500/10'
            : 'text-emerald-500 bg-emerald-500/10',
      highlight: expiredCount > 0,
    },
  ]

  const statusStyles: Record<string, string> = {
    pending_kyc: 'bg-yellow-500/10 text-yellow-500',
    pending_payment: 'bg-blue-500/10 text-blue-500',
    pending_agreement: 'bg-orange-500/10 text-orange-500',
    active: 'bg-green-500/10 text-green-500',
    cancelled: 'bg-red-500/10 text-red-500',
    completed: 'bg-gray-500/10 text-gray-500',
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Overview
        </p>
        <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Real-time stats for your rental business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={`rounded-2xl border bg-[var(--card)] p-5 transition-all ${
                stat.highlight
                  ? 'border-red-500/40 shadow-md shadow-red-500/10'
                  : 'border-[var(--border)]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* COMPLIANCE ALERTS PANEL */}
      {complianceIssues.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold">Vehicle Compliance</h2>
              {expiredCount > 0 && (
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-600">
                  {expiredCount} expired
                </span>
              )}
            </div>
            <Link
              href="/admin/fleet"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Manage fleet →
            </Link>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {complianceIssues.slice(0, 8).map((v) => {
              const worstStatus =
                v.insStatus === 'expired' || v.regStatus === 'expired'
                  ? 'expired'
                  : v.insStatus === 'critical' || v.regStatus === 'critical'
                    ? 'critical'
                    : 'warning'

              const statusColors: Record<string, string> = {
                expired: 'bg-red-500/10 text-red-600 border-red-500/30',
                critical: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
                warning: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
              }

              return (
                <Link
                  key={v.id}
                  href={`/admin/fleet/${v.id}`}
                  className="flex flex-col gap-3 p-5 transition hover:bg-[var(--muted)]/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors[worstStatus]}`}
                      >
                        {worstStatus}
                      </span>
                      {v.plate_number && (
                        <span className="font-mono text-xs text-[var(--muted-foreground)]">
                          {v.plate_number}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
                        Insurance:{' '}
                        <span className="font-semibold text-[var(--foreground)]">
                          {v.insDays === null
                            ? '—'
                            : v.insDays < 0
                              ? `${Math.abs(v.insDays)}d overdue`
                              : `${v.insDays}d left`}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <FileWarning className="h-3.5 w-3.5 text-[var(--accent)]" />
                        Registration:{' '}
                        <span className="font-semibold text-[var(--foreground)]">
                          {v.regDays === null
                            ? '—'
                            : v.regDays < 0
                              ? `${Math.abs(v.regDays)}d overdue`
                              : `${v.regDays}d left`}
                        </span>
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[var(--accent)]">
                    Update →
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Recent Bookings</h2>
          </div>
          <Link
            href="/admin/bookings"
            className="text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            View all →
          </Link>
        </div>

        {!recentBookings || recentBookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            No bookings yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {((recentBookings ?? []) as BookingRow[]).map((booking) => {
              const vehicle = first(booking.vehicles ?? null)
              const customer = first(booking.profiles ?? null)

              return (
                <div
                  key={booking.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {vehicle?.make} {vehicle?.model}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          statusStyles[booking.status] ?? ''
                        }`}
                      >
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {customer?.full_name ?? customer?.email ?? 'Unknown customer'}
                      {' · '}
                      {new Date(booking.start_date).toLocaleDateString('en-AE')}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatAED(Number(booking.monthly_price_aed))}/mo
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}