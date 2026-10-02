import {
  DollarSign,
  TrendingUp,
  Clock,
  XCircle,
  RotateCcw,
  CreditCard,
} from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import TransactionTable from './TransactionTable'
import RevenueChart from './RevenueChart'
import StatusDonut from './StatusDonut'
import TypeBreakdown from './TypeBreakdown'
import TopCustomers from './TopCustomers'
import PromoManager from './PromoManager'

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function AdminFinancePage() {
  const { supabase } = await requireAdmin()

  // ⚡ PARALLEL + LIMIT — 3-5x faster
  const [{ data: payments, error }, { data: promos }] = await Promise.all([
    supabase
      .from('payments')
      .select(`
        id, booking_id, amount_aed, type, status, provider, paid_at, created_at, customer_id,
        profiles:customer_id ( full_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('promo_codes')
      .select('id, code, discount_type, discount_value, max_uses, is_active, valid_until')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Finance</h1>
        <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
          Error: {error.message}
        </p>
      </div>
    )
  }

  const all = payments ?? []

  // === Calculations ===
  const succeededPayments = all.filter((p) => p.status === 'succeeded')
  const pendingPayments = all.filter((p) => p.status === 'pending')
  const failedPayments = all.filter((p) => p.status === 'failed')
  const refundedPayments = all.filter((p) => p.status === 'refunded')

  const totalRevenue = succeededPayments.reduce(
    (s, p) => s + Number(p.amount_aed || 0),
    0
  )

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const thisMonthMs = thisMonth.getTime()

  const monthlyRevenue = succeededPayments
    .filter((p) => p.paid_at && new Date(p.paid_at).getTime() >= thisMonthMs)
    .reduce((s, p) => s + Number(p.amount_aed || 0), 0)

  const pendingAmount = pendingPayments.reduce(
    (s, p) => s + Number(p.amount_aed || 0),
    0
  )
  const failedAmount = failedPayments.reduce(
    (s, p) => s + Number(p.amount_aed || 0),
    0
  )
  const refundedAmount = refundedPayments.reduce(
    (s, p) => s + Number(p.amount_aed || 0),
    0
  )

  const vat = totalRevenue * 0.05
  const netRevenue = totalRevenue - vat

  const stats = [
    {
      label: 'Total Revenue',
      value: formatAED(totalRevenue),
      subtitle: `VAT: ${formatAED(vat)}`,
      icon: DollarSign,
      color: 'text-[var(--accent)] bg-[var(--accent)]/10',
    },
    {
      label: 'This Month',
      value: formatAED(monthlyRevenue),
      subtitle: 'Current month',
      icon: TrendingUp,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      label: 'Pending',
      value: formatAED(pendingAmount),
      subtitle: `${pendingPayments.length} payments`,
      icon: Clock,
      color: 'text-yellow-500 bg-yellow-500/10',
    },
    {
      label: 'Failed',
      value: formatAED(failedAmount),
      subtitle: `${failedPayments.length} payments`,
      icon: XCircle,
      color: 'text-red-500 bg-red-500/10',
    },
    {
      label: 'Refunded',
      value: formatAED(refundedAmount),
      subtitle: `${refundedPayments.length} refunds`,
      icon: RotateCcw,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Net Revenue',
      value: formatAED(netRevenue),
      subtitle: 'After 5% VAT',
      icon: CreditCard,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ]

  // Revenue chart data (6 months) — single pass
  const monthlyBuckets: number[] = [0, 0, 0, 0, 0, 0]
  const now = new Date()
  for (const p of succeededPayments) {
    if (!p.paid_at) continue
    const paidDate = new Date(p.paid_at)
    const diffMonths =
      (now.getFullYear() - paidDate.getFullYear()) * 12 +
      (now.getMonth() - paidDate.getMonth())
    if (diffMonths >= 0 && diffMonths < 6) {
      const bucketIndex = 5 - diffMonths
      monthlyBuckets[bucketIndex] += Number(p.amount_aed || 0)
    }
  }

  const chartData: { month: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    chartData.push({
      month: d.toLocaleDateString('en-AE', { month: 'short' }),
      value: monthlyBuckets[5 - i],
    })
  }

  const statusSlices = [
    { label: 'Succeeded', value: succeededPayments.length, color: '#10b981' },
    { label: 'Pending', value: pendingPayments.length, color: '#eab308' },
    { label: 'Failed', value: failedPayments.length, color: '#ef4444' },
    { label: 'Refunded', value: refundedPayments.length, color: '#3b82f6' },
  ]

  // Type breakdown — single pass
  const typeTotals: Record<string, number> = {
    deposit: 0,
    monthly_rental: 0,
    add_on: 0,
    refund: 0,
  }
  for (const p of all) {
    const t = String(p.type ?? '')
    if (p.status === 'succeeded' && t in typeTotals && t !== 'refund') {
      typeTotals[t] += Number(p.amount_aed || 0)
    }
    if (t === 'refund') {
      typeTotals[t] += Number(p.amount_aed || 0)
    }
  }

  const typeItems = [
    { label: 'deposit', value: typeTotals.deposit, color: '#6366f1' },
    { label: 'monthly_rental', value: typeTotals.monthly_rental, color: '#10b981' },
    { label: 'add_on', value: typeTotals.add_on, color: '#f59e0b' },
    { label: 'refund', value: typeTotals.refund, color: '#3b82f6' },
  ]

  // Top customers — single pass
  const customerMap = new Map<
    string,
    { name: string; email: string; total: number; count: number }
  >()
  for (const p of succeededPayments) {
    const c = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
    const key = p.customer_id
    const existing = customerMap.get(key) ?? {
      name: c?.full_name ?? 'Unknown',
      email: c?.email ?? '',
      total: 0,
      count: 0,
    }
    existing.total += Number(p.amount_aed || 0)
    existing.count += 1
    customerMap.set(key, existing)
  }

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const promosMissing = promos == null

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Finance
        </p>
        <h1 className="mt-2 text-3xl font-bold">Financial Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Revenue analytics, trends, and insights.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {stat.subtitle}
                  </p>
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

      <div className="mb-8">
        <RevenueChart data={chartData} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <StatusDonut slices={statusSlices} />
        <TypeBreakdown items={typeItems} />
      </div>

      <div className="mb-8">
        <TopCustomers customers={topCustomers} />
      </div>

      <div className="mb-8">
        <PromoManager promos={promos ?? []} missingTable={promosMissing} />
      </div>

      <TransactionTable payments={all} />
    </div>
  )
}