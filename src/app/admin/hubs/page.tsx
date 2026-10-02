import { requireAdmin } from '@/lib/admin'
import {
  MapPin,
  Building2,
  Phone,
  Clock,
  Star,
  Car,
} from 'lucide-react'
import HubForm from './HubForm'
import HubActions from './HubActions'

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminHubsPage() {
  const { supabase } = await requireAdmin()

  const { data: hubs } = await supabase
    .from('hubs')
    .select('id, name, address, area, city, phone, opening_hours, is_active, is_primary, notes, created_at')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: vehicleCounts } = await supabase
    .from('vehicles')
    .select('hub_id')
    .not('hub_id', 'is', null)

  const countByHub = new Map<string, number>()
  for (const v of vehicleCounts ?? []) {
    if (!v.hub_id) continue
    countByHub.set(v.hub_id, (countByHub.get(v.hub_id) ?? 0) + 1)
  }

  const allHubs = hubs ?? []
  const activeCount = allHubs.filter((h) => h.is_active).length

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          RTA Compliance
        </p>
        <h1 className="mt-2 text-3xl font-bold">Hubs & Locations</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Manage pickup locations, addresses, and RTA-registered hubs.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <MapPin className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Total Hubs</p>
              <p className="text-2xl font-bold">{allHubs.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Building2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Active</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Car className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Assigned Vehicles</p>
              <p className="text-2xl font-bold">
                {Array.from(countByHub.values()).reduce((s, n) => s + n, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add new hub */}
      <div className="mb-8">
        <HubForm />
      </div>

      {/* Hubs list */}
      {allHubs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <MapPin className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <p className="mt-4 font-semibold">No hubs yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Add your first pickup location above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {allHubs.map((hub) => {
            const vehicleCount = countByHub.get(hub.id) ?? 0

            return (
              <div
                key={hub.id}
                className={`overflow-hidden rounded-2xl border bg-[var(--card)] shadow-sm transition ${
                  hub.is_active
                    ? 'border-[var(--border)]'
                    : 'border-dashed border-gray-500/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                      <MapPin className="h-5 w-5 text-[var(--accent)]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-lg tracking-tight">
                          {hub.name}
                        </h3>
                        {hub.is_primary && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {hub.area ?? hub.city} · Created {formatDate(hub.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                    <span className="text-[var(--foreground)]/80">{hub.address}</span>
                  </div>

                  {hub.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                      <span className="font-mono text-[var(--foreground)]/80">{hub.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                    <span className="text-[var(--foreground)]/80">{hub.opening_hours}</span>
                  </div>

                  {hub.notes && (
                    <p className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs leading-5 text-[var(--muted-foreground)]">
                      {hub.notes}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Car className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                      <span className="font-semibold">{vehicleCount}</span>
                      <span className="text-[var(--muted-foreground)]">
                        vehicle{vehicleCount === 1 ? '' : 's'} assigned
                      </span>
                    </div>

                    <HubActions
                      hubId={hub.id}
                      isActive={hub.is_active}
                      hubName={hub.name}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}