import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  Percent,
  Filter,
  Car,
  UserPlus,
  UserCheck,
} from 'lucide-react'
import { requireAdmin } from '@/lib/admin'

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin()

  const [bookingsRes, vehiclesRes, paymentsRes, profilesRes] = await Promise.all([
    supabase.from('bookings').select('id, status, customer_id, vehicle_id, monthly_price_aed, duration_months, created_at'),
    supabase.from('vehicles').select('id, make, model, plate_number, status'),
    supabase.from('payments').select('id, booking_id, customer_id, amount_aed, status, paid_at, created_at'),
    supabase.from('profiles').select('id, role, created_at').eq('role', 'customer'),
  ])

  const bookings = bookingsRes.data ?? []
  const vehicles = vehiclesRes.data ?? []
  const payments = paymentsRes.data ?? []
  const profiles = profilesRes.data ?? []

  // KPI Calculations
  const succeededPayments = payments.filter((p) => p.status === 'succeeded')
  const totalRevenue = succeededPayments.reduce((s, p) => s + Number(p.amount_aed || 0), 0)
  const activeBookings = bookings.filter((b) => b.status === 'active')
  const mrr = activeBookings.reduce((s, b) => s + Number(b.monthly_price_aed || 0), 0)
  const aov = bookings.length > 0
    ? bookings.reduce((s, b) => s + Number(b.monthly_price_aed || 0), 0) / bookings.length
    : 0
  const rentedVehicles = vehicles.filter((v) => v.status === 'rented').length
  const utilization = vehicles.length > 0 ? Math.round((rentedVehicles / vehicles.length) * 100) : 0

  // Funnel
  const funnelStages = [
    { label: 'Total Bookings', value: bookings.length, color: '#6366f1' },
    { label: 'KYC Completed', value: bookings.filter((b) => b.status !== 'pending_kyc').length, color: '#8b5cf6' },
    { label: 'Payment Done', value: bookings.filter((b) => ['active', 'completed'].includes(b.status)).length, color: '#10b981' },
    { label: 'Active Rentals', value: activeBookings.length, color: '#059669' },
  ]

  // Fleet Utilization
  const vehicleUtilization = vehicles.map((v) => {
    const bookingsForVehicle = bookings.filter((b) => b.vehicle_id === v.id)
    const rentalMonths = bookingsForVehicle
      .filter((b) => ['active', 'completed'].includes(b.status))
      .reduce((s, b) => s + (b.duration_months || 1), 0)
    const utilPercent = Math.min(Math.round((rentalMonths / 12) * 100), 100)
    return {
      id: v.id,
      name: `${v.make} ${v.model}`,
      plate: v.plate_number || 'N/A',
      utilization: utilPercent,
    }
  }).sort((a, b) => b.utilization - a.utilization).slice(0, 8)

  // Revenue per Vehicle
  const vehicleRevenueMap = new Map<string, { name: string; plate: string; revenue: number; bookings: number }>()
  vehicles.forEach((v) => {
    const vBookings = bookings.filter((b) => b.vehicle_id === v.id)
    const vBookingIds = vBookings.map((b) => b.id)
    const vRevenue = succeededPayments
      .filter((p) => p.booking_id && vBookingIds.includes(p.booking_id))
      .reduce((s, p) => s + Number(p.amount_aed || 0), 0)
    if (vRevenue > 0 || vBookings.length > 0) {
      vehicleRevenueMap.set(v.id, {
        name: `${v.make} ${v.model}`,
        plate: v.plate_number || 'N/A',
        revenue: vRevenue,
        bookings: vBookings.length,
      })
    }
  })
  const topVehicles = Array.from(vehicleRevenueMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // Customer Retention
  const customerBookingCount = new Map<string, number>()
  bookings.forEach((b) => {
    customerBookingCount.set(b.customer_id, (customerBookingCount.get(b.customer_id) || 0) + 1)
  })
  const newCustomers = Array.from(customerBookingCount.values()).filter((c) => c === 1).length
  const returningCustomers = Array.from(customerBookingCount.values()).filter((c) => c > 1).length
  const totalActiveCustomers = customerBookingCount.size
  const repeatRate = totalActiveCustomers > 0 ? Math.round((returningCustomers / totalActiveCustomers) * 100) : 0

  const kpis = [
    { label: 'Monthly Recurring Revenue', value: formatAED(mrr), subtitle: `${activeBookings.length} active rentals`, icon: TrendingUp, color: 'text-[var(--accent)] bg-[var(--accent)]/10' },
    { label: 'Average Order Value', value: formatAED(aov), subtitle: 'Per booking', icon: DollarSign, color: 'text-green-500 bg-green-500/10' },
    { label: 'Fleet Utilization', value: `${utilization}%`, subtitle: `${rentedVehicles} of ${vehicles.length} vehicles`, icon: Activity, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Active Customers', value: totalActiveCustomers, subtitle: `${profiles.length} registered`, icon: Users, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Total Revenue', value: formatAED(totalRevenue), subtitle: `${succeededPayments.length} payments`, icon: BarChart3, color: 'text-[var(--accent)] bg-[var(--accent)]/10' },
    { label: 'Repeat Rate', value: `${repeatRate}%`, subtitle: 'Returning customers', icon: Percent, color: 'text-orange-500 bg-orange-500/10' },
  ]

  const maxFunnel = Math.max(...funnelStages.map((s) => s.value), 1)

  function getUtilColor(percent: number) {
    if (percent >= 80) return '#10b981'
    if (percent >= 50) return '#f59e0b'
    if (percent >= 20) return '#6366f1'
    return '#ef4444'
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Analytics</p>
        <h1 className="mt-2 text-3xl font-bold">Business Intelligence</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Key metrics, fleet performance, and customer insights.</p>
      </div>

      {/* KPI Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{kpi.subtitle}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Funnel + Retention */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <Filter className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Booking Funnel</h2>
          </div>
          <div className="space-y-4">
            {funnelStages.map((stage, i) => {
              const widthPercent = (stage.value / maxFunnel) * 100
              return (
                <div key={stage.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span className="font-bold">{stage.value}</span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-lg bg-[var(--muted)]">
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{ width: `${Math.max(widthPercent, 3)}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Retention */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Customer Retention</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <UserPlus className="h-3.5 w-3.5" />
                New
              </div>
              <p className="mt-2 text-2xl font-bold">{newCustomers}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <UserCheck className="h-3.5 w-3.5" />
                Returning
              </div>
              <p className="mt-2 text-2xl font-bold text-green-500">{returningCustomers}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[var(--accent)]/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Repeat Rate</span>
              <span className="text-lg font-bold text-[var(--accent)]">{repeatRate}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--background)]">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${repeatRate}%` }} />
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
            Total {totalActiveCustomers} customer{totalActiveCustomers !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Fleet + Top Vehicles */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fleet Utilization */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Fleet Utilization</h2>
          </div>
          {vehicleUtilization.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No vehicles yet</p>
          ) : (
            <div className="space-y-4">
              {vehicleUtilization.map((v) => (
                <div key={v.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{v.name}</span>
                      <span className="ml-2 font-mono text-xs text-[var(--muted-foreground)]">{v.plate}</span>
                    </div>
                    <span className="font-bold" style={{ color: getUtilColor(v.utilization) }}>{v.utilization}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div className="h-full rounded-full" style={{ width: `${v.utilization}%`, backgroundColor: getUtilColor(v.utilization) }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Earning Vehicles */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <Car className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Top Earning Vehicles</h2>
          </div>
          {topVehicles.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">No revenue data yet</p>
          ) : (
            <div className="space-y-3">
              {topVehicles.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {item.plate} · {item.bookings} booking{item.bookings !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-[var(--accent)]">{formatAED(item.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}