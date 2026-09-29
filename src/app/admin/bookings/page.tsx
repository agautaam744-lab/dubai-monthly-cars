import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { FleetChart, RevenueChart } from '@/components/admin/DashboardCharts'
import {
  LayoutDashboard,
  Car,
  DollarSign,
  FileText,
  AlertCircle,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard | Dubai Monthly Cars',
}

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin()

  // 1. Fetch Stats Data
  const [
    { count: activeRentals },
    { count: availableFleet },
    { count: pendingKyc },
    { count: pendingPayments },
    { count: totalCustomers },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
  ])

  // Monthly Revenue Calculation
  const { data: payments } = await supabase
    .from('payments')
    .select('amount_aed')
    .eq('status', 'succeeded')
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
  
  const monthlyRevenue = payments?.reduce((sum, p) => sum + Number(p.amount_aed || 0), 0) || 0

  // 2. Fetch Charts Data
  // Fleet Chart Data
  const { data: vehicles } = await supabase.from('vehicles').select('status')
  const fleetCounts: Record<string, number> = {}
  vehicles?.forEach((v: any) => { fleetCounts[v.status] = (fleetCounts[v.status] || 0) + 1 })
  const fleetChartData = Object.entries(fleetCounts).map(([name, value]) => ({ name, value }))

  // Revenue Chart Data (Last 6 months simplified)
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount_aed, created_at')
    .eq('status', 'succeeded')
    .order('created_at', { ascending: true })

  const revenueByMonth: Record<string, number> = {}
  allPayments?.forEach((p: any) => {
    const date = new Date(p.created_at)
    const monthKey = date.toLocaleString('default', { month: 'short' })
    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(p.amount_aed)
  })
  const revenueChartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }))

  // 3. Fetch Recent Bookings
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      created_at,
      monthly_price_aed,
      vehicles ( make, model ),
      profiles:customer_id ( full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Active Rentals', value: activeRentals ?? 0, icon: Car, color: 'text-green-500 bg-green-500/10' },
    { label: 'Available Fleet', value: `${availableFleet ?? 0} / ${(availableFleet ?? 0) + (activeRentals ?? 0)}`, icon: LayoutDashboard, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Monthly Revenue', value: `AED ${monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-[var(--accent)] bg-[var(--accent)]/10' },
    { label: 'Pending KYC', value: pendingKyc ?? 0, icon: FileText, color: 'text-yellow-500 bg-yellow-500/10' },
    { label: 'Pending Payments', value: pendingPayments ?? 0, icon: AlertCircle, color: 'text-red-500 bg-red-500/10' },
    { label: 'Total Customers', value: totalCustomers ?? 0, icon: Users, color: 'text-purple-500 bg-purple-500/10' },
  ]

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Overview</p>
        <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Real-time stats for your rental business.</p>
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
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {fleetChartData.length > 0 && <FleetChart data={fleetChartData} />}
        {revenueChartData.length > 0 && <RevenueChart data={revenueChartData} />}
      </div>

      {/* Recent Bookings */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-bold">Recent Bookings</h2>
          </div>
          <Link href="/admin/bookings" className="flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {recentBookings && recentBookings.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {recentBookings.map((booking: any) => (
              <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="flex items-center justify-between p-4 transition hover:bg-[var(--muted)]/50">
                <div>
                  <p className="font-semibold">{booking.vehicles?.make} {booking.vehicles?.model}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{booking.profiles?.full_name || 'Unknown Customer'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">AED {booking.monthly_price_aed}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                    booking.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-[var(--muted-foreground)]">No bookings yet.</div>
        )}
      </div>
    </div>
  )
}