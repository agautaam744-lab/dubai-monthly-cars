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

  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      id, booking_id, amount_aed, type, status, provider, paid_at, created_at, customer_id,
      profiles:customer_id ( full_name, email )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Finance</h1>
        <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">Error: {error.message}</p>
      </div>
    )
  }

  const all = payments ?? []

  // === Calculations ===
  const totalRevenue = all.filter((p) => p.status === 'succeeded').reduce((s, p) => s + Number(p.amount_aed || 0), 0)
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const monthlyRevenue = all.filter((p) => p.status === 'succeeded' && p.paid_at && new Date(p.paid_at) >= thisMonth).reduce((s, p) => s + Number(p.amount_aed || 0), 0)
  const pendingAmount = all.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount_aed || 0), 0)
  const failedAmount = all.filter((p) => p.status === 'failed').reduce((s, p) => s + Number(p.amount_aed || 0), 0)
  const refundedAmount = all.filter((p) => p.status === 'refunded').reduce((s, p) => s + Number(p.amount_aed || 0), 0)
  const vat = totalRevenue * 0.05
  const netRevenue = totalRevenue - vat

  // Stats
  const stats = [
    { label: 'Total Revenue', value: formatAED(totalRevenue), subtitle: `VAT: ${formatAED(vat)}`, icon: DollarSign, color: 'text-[var(--accent)] bg-[var(--accent)]/10' },
    { label: 'This Month', value: formatAED(monthlyRevenue), subtitle: 'Current month', icon: TrendingUp, color: 'text-green-500 bg-green-500/10' },
    { label: 'Pending', value: formatAED(pendingAmount), subtitle: `${all.filter((p) => p.status === 'pending').length} payments`, icon: Clock, color: 'text-yellow-500 bg-yellow-500/10' },
    { label: 'Failed', value: formatAED(failedAmount), subtitle: `${all.filter((p) => p.status === 'failed').length} payments`, icon: XCircle, color: 'text-red-500 bg-red-500/10' },
    { label: 'Refunded', value: formatAED(refundedAmount), subtitle: `${all.filter((p) => p.status === 'refunded').length} refunds`, icon: RotateCcw, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Net Revenue', value: formatAED(netRevenue), subtitle: 'After 5% VAT', icon: CreditCard, color: 'text-purple-500 bg-purple-500/10' },
  ]

  // Revenue chart data (6 months)
  const chartData: { month: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const monthTotal = all
      .filter((p) => p.status === 'succeeded' && p.paid_at && new Date(p.paid_at) >= monthStart && new Date(p.paid_at) <= monthEnd)
      .reduce((s, p) => s + Number(p.amount_aed || 0), 0)
    chartData.push({ month: monthStart.toLocaleDateString('en-AE', { month: 'short' }), value: monthTotal })
  }

  // Status donut
  const statusSlices = [
    { label: 'Succeeded', value: all.filter((p) => p.status === 'succeeded').length, color: '#10b981' },
    { label: 'Pending', value: all.filter((p) => p.status === 'pending').length, color: '#eab308' },
    { label: 'Failed', value: all.filter((p) => p.status === 'failed').length, color: '#ef4444' },
    { label: 'Refunded', value: all.filter((p) => p.status === 'refunded').length, color: '#3b82f6' },
  ]

  
    // Type breakdown
  const typeItems = [
    { label: 'deposit', value: all.filter((p) => p.type === 'deposit' && p.status === 'succeeded').reduce((s, p) => s + Number(p.amount_aed || 0), 0), color: '#6366f1' },
    { label: 'monthly_rental', value: all.filter((p) => p.type === 'monthly_rental' && p.status === 'succeeded').reduce((s, p) => s + Number(p.amount_aed || 0), 0), color: '#10b981' },
    { label: 'add_on', value: all.filter((p) => p.type === 'add_on' && p.status === 'succeeded').reduce((s, p) => s + Number(p.amount_aed || 0), 0), color: '#f59e0b' },
    { label: 'refund', value: all.filter((p) => p.type === 'refund').reduce((s, p) => s + Number(p.amount_aed || 0), 0), color: '#3b82f6' },
  ]

  // Top customers
  const customerMap = new Map<string, { name: string; email: string; total: number; count: number }>()
  all.filter((p) => p.status === 'succeeded').forEach((p) => {
    const c = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
    const key = p.customer_id
    const existing = customerMap.get(key) || { name: c?.full_name ?? 'Unknown', email: c?.email ?? '', total: 0, count: 0 }
    existing.total += Number(p.amount_aed || 0)
    existing.count += 1
    customerMap.set(key, existing)
  })
  const topCustomers = Array.from(customerMap.values()).sort((a, b) => b.total - a.total).slice(0, 5)

  const { data: promos } = await supabase
    .from('promo_codes')
    .select('id, code, discount_percent, max_uses, is_active, expires_at')
    .order('created_at', { ascending: false })
  const promosMissing = promos == null

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Finance</p>
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
            <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{stat.subtitle}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue Chart (Full width) */}
      <div className="mb-8">
        <RevenueChart data={chartData} />
      </div>

      {/* 2 Column Layout: Donut + Type Breakdown */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <StatusDonut slices={statusSlices} />
        <TypeBreakdown items={typeItems} />
      </div>

      {/* Top Customers */}
      <div className="mb-8">
        <TopCustomers customers={topCustomers} />
      </div>

      {/* Promo Codes */}
      <div className="mb-8">
        <PromoManager promos={promos ?? []} missingTable={promosMissing} />
      </div>

      {/* Transactions Table */}
      <TransactionTable payments={all} />
    </div>
  )
}