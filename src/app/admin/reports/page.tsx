import { requireAdmin } from '@/lib/admin'

export default async function AdminReportsPage() {
  const { supabase } = await requireAdmin()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('status, monthly_price_aed, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
          Error loading reports: {error.message}
        </p>
      </div>
    )
  }

  const summary = {
    active: (bookings ?? []).filter((booking: any) => booking.status === 'active').length,
    pending: (bookings ?? []).filter((booking: any) => booking.status === 'pending').length,
    completed: (bookings ?? []).filter((booking: any) => booking.status === 'completed').length,
    totalRevenue: (bookings ?? []).reduce(
      (sum, booking: any) => sum + Number(booking.monthly_price_aed || 0),
      0
    ),
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Reports
        </p>
        <h1 className="mt-2 text-3xl font-bold">Operations Summary</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active Rentals', value: summary.active },
          { label: 'Pending', value: summary.pending },
          { label: 'Completed', value: summary.completed },
          { label: 'Projected Revenue', value: `AED ${summary.totalRevenue.toLocaleString()}` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
