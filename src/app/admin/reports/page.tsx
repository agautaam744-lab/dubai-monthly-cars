import { requireAdmin } from '@/lib/admin'
import ExportButtons from './ExportButtons'
import type { BookingRow, PaymentRow, VehicleRef } from '@/types/database'

interface FleetVehicle extends VehicleRef {
  id: string
  status: string
}

export default async function AdminReportsPage() {
  const { supabase } = await requireAdmin()

  const [{ data: bookings }, { data: payments }, { data: vehicles }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, status, monthly_price_aed, total_add_ons_aed, vehicle_id, customer_id, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('payments')
      .select('id, booking_id, customer_id, amount_aed, type, status, due_date, paid_at, created_at')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase.from('vehicles').select('id, make, model, plate_number, status'),
  ])

  const allBookings = (bookings ?? []) as BookingRow[]
  const allPayments = (payments ?? []) as PaymentRow[]
  const allVehicles = (vehicles ?? []) as FleetVehicle[]
  const today = new Date().toISOString().slice(0, 10)

  const succeeded = allPayments.filter((p) => p.status === 'succeeded')
  const revenue = succeeded.reduce((s, p) => s + Number(p.amount_aed || 0), 0)
  const ancillary = succeeded
    .filter((p) => !['monthly_rental', 'deposit'].includes(String(p.type)))
    .reduce((s, p) => s + Number(p.amount_aed || 0), 0)
  const overdue = allPayments.filter(
    (p) => p.status === 'pending' && p.due_date && String(p.due_date).slice(0, 10) < today
  )
  const overdueAmount = overdue.reduce((s, p) => s + Number(p.amount_aed || 0), 0)

  const rented = allVehicles.filter((v) => v.status === 'rented').length
  const utilization = allVehicles.length > 0 ? Math.round((rented / allVehicles.length) * 100) : 0

  const customers = new Set(allBookings.map((b) => b.customer_id))
  const repeaters = allBookings.reduce((m: Map<string | undefined, number>, b) => {
    m.set(b.customer_id, (m.get(b.customer_id) ?? 0) + 1)
    return m
  }, new Map<string | undefined, number>())
  const returning = Array.from(repeaters.values()).filter((c) => c > 1).length

  const perVehicle = allVehicles.map((v) => {
    const ids = new Set(allBookings.filter((b) => b.vehicle_id === v.id).map((b) => b.id))
    const rev = succeeded
      .filter((p) => p.booking_id && ids.has(p.booking_id))
      .reduce((s, p) => s + Number(p.amount_aed || 0), 0)
    return {
      vehicle: `${v.make} ${v.model}`,
      plate: v.plate_number ?? '',
      status: v.status,
      bookings: ids.size,
      revenue: rev,
    }
  })

  const summary = {
    active: allBookings.filter((b) => b.status === 'active').length,
    completed: allBookings.filter((b) => b.status === 'completed').length,
    customers: customers.size,
    returning,
    utilization,
    revenue,
    ancillary,
    overdue: overdue.length,
    overdueAmount,
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
            Reports
          </p>
          <h1 className="mt-2 text-3xl font-bold">Operations Summary</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Fleet utilization, revenue per vehicle, retention and overdue payments.
          </p>
        </div>
        <ExportButtons
          bookings={allBookings}
          payments={allPayments}
          perVehicle={perVehicle}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active Rentals', value: summary.active },
          { label: 'Completed', value: summary.completed },
          { label: 'Fleet Utilization', value: `${summary.utilization}%` },
          { label: 'Total Revenue', value: `AED ${summary.revenue.toLocaleString()}` },
          { label: 'Ancillary Revenue', value: `AED ${summary.ancillary.toLocaleString()}` },
          { label: 'Overdue Payments', value: `${summary.overdue} (AED ${summary.overdueAmount.toLocaleString()})` },
          { label: 'Customers', value: summary.customers },
          { label: 'Returning Customers', value: summary.returning },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] p-5">
          <h2 className="font-semibold">Revenue per Vehicle</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {perVehicle.slice(0, 15).map((v, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{v.vehicle}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{v.plate} · {v.bookings} bookings · {v.status}</p>
              </div>
              <p className="font-bold text-[var(--accent)]">AED {v.revenue.toLocaleString()}</p>
            </div>
          ))}
          {perVehicle.length === 0 && (
            <p className="p-6 text-center text-sm text-[var(--muted-foreground)]">No vehicles yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
