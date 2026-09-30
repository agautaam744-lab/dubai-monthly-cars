'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import VehicleCard, { type Vehicle } from './VehicleCard'

export default function FleetFilters({ vehicles }: { vehicles: Vehicle[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) {
        return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        const matches =
          v.make?.toLowerCase().includes(q) ||
          v.model?.toLowerCase().includes(q) ||
          v.plate_number?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q) ||
          v.location?.toLowerCase().includes(q)
        if (!matches) return false
      }

      return true
    })
  }, [vehicles, search, statusFilter])

  const statusTabs = [
    { value: 'all', label: 'All', count: vehicles.length },
    {
      value: 'available',
      label: 'Available',
      count: vehicles.filter((v) => v.status === 'available').length,
    },
    {
      value: 'rented',
      label: 'Rented',
      count: vehicles.filter((v) => v.status === 'rented').length,
    },
    {
      value: 'under_maintenance',
      label: 'Maintenance',
      count: vehicles.filter((v) => v.status === 'under_maintenance').length,
    },
    {
      value: 'out_of_service',
      label: 'Out of Service',
      count: vehicles.filter((v) => v.status === 'out_of_service').length,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by make, model, plate, or location..."
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-11 pr-11 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={[
                  'inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-medium transition',
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
                ].join(' ')}
              >
                {tab.label}
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                    active
                      ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {search && (
        <p className="text-sm text-[var(--muted-foreground)]">
          Found <span className="font-semibold">{filtered.length}</span> vehicle
          {filtered.length !== 1 ? 's' : ''} matching &quot;{search}&quot;
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="font-semibold">No vehicles match your filters</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Try changing the search or status filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  )
}