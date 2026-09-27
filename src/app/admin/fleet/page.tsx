import Link from 'next/link'
import { Car, Plus, CheckCircle2, Wrench } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import FleetFilters from './FleetFilters'

export default async function AdminFleetPage() {
  const { supabase } = await requireAdmin()

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      make,
      model,
      year,
      category,
      transmission,
      fuel_type,
      seats,
      color,
      plate_number,
      current_mileage,
      status,
      location,
      created_at,
      vehicle_images ( id, storage_path, is_primary, sort_order ),
      vehicle_pricing (
        monthly_price_aed,
        pricing_tiers ( name, sort_order )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Fleet Management</h1>
        <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
          Error loading fleet: {error.message}
        </p>
      </div>
    )
  }

  const fleet = vehicles ?? []

  const total = fleet.length
  const available = fleet.filter((v) => v.status === 'available').length
  const rented = fleet.filter((v) => v.status === 'rented').length
  const maintenance = fleet.filter((v) =>
    ['under_maintenance', 'out_of_service'].includes(v.status)
  ).length

  const stats = [
    {
      label: 'Total Fleet',
      value: total,
      icon: Car,
      color: 'text-[var(--accent)] bg-[var(--accent)]/10',
    },
    {
      label: 'Available',
      value: available,
      icon: CheckCircle2,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      label: 'Currently Rented',
      value: rented,
      icon: Car,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'In Maintenance',
      value: maintenance,
      icon: Wrench,
      color: 'text-yellow-500 bg-yellow-500/10',
    },
  ]

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
            Fleet
          </p>
          <h1 className="mt-2 text-3xl font-bold">Fleet Management</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Add, edit, and manage your vehicle inventory.
          </p>
        </div>

        <Link
          href="/admin/fleet/new"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
        >
          <Plus className="h-4 w-4" />
          Add New Vehicle
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {fleet.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Car className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <h2 className="mt-4 text-lg font-semibold">No vehicles yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Add your first vehicle to get started.
          </p>
          <Link
            href="/admin/fleet/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            <Plus className="h-4 w-4" />
            Add First Vehicle
          </Link>
        </div>
      ) : (
        <FleetFilters vehicles={fleet} />
      )}
    </div>
  )
}