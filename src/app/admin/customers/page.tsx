import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import {
  Users,
  Crown,
  UserPlus,
  AlertTriangle,
  ChevronRight,
  Search,
} from 'lucide-react'

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type Segment = 'all' | 'vip' | 'active' | 'new' | 'at-risk'

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string; q?: string }>
}) {
  const { supabase } = await requireAdmin()
  const params = await searchParams

  const segment = (params.segment as Segment) ?? 'all'
  const query = (params.q ?? '').trim().toLowerCase()

  const { data: customers, error } = await supabase
    .from('customer_summary')
    .select('*')
    .order('total_revenue', { ascending: false })
    .limit(500)

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
          Error: {error.message}
        </p>
      </div>
    )
  }

  const all = customers ?? []
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 86400000
  const ninetyDaysAgo = now - 90 * 86400000

  const classify = (c: typeof all[0]): Segment[] => {
    const tags: Segment[] = []

    const revenue = Number(c.total_revenue ?? 0)
    const bookings = Number(c.total_bookings ?? 0)

    if (revenue >= 10000 || bookings >= 3) tags.push('vip')
    if (Number(c.active_bookings ?? 0) > 0) tags.push('active')
    if (new Date(c.joined_at).getTime() >= thirtyDaysAgo) tags.push('new')

    const lastBooking = c.last_booking_at ? new Date(c.last_booking_at).getTime() : 0
    if (lastBooking < ninetyDaysAgo && bookings > 0) tags.push('at-risk')

    return tags
  }

  const enriched = all.map((c) => ({ ...c, segments: classify(c) }))

  const filtered = enriched.filter((c) => {
    if (segment !== 'all' && !c.segments.includes(segment)) return false
    if (query) {
      const haystack = `${c.full_name ?? ''} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })

  const stats = [
    { label: 'Total Customers', value: all.length, icon: Users, color: 'text-sky-500 bg-sky-500/10' },
    { label: 'VIP', value: enriched.filter((c) => c.segments.includes('vip')).length, icon: Crown, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Active', value: enriched.filter((c) => c.segments.includes('active')).length, icon: UserPlus, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'At Risk', value: enriched.filter((c) => c.segments.includes('at-risk')).length, icon: AlertTriangle, color: 'text-red-500 bg-red-500/10' },
  ]

  const segmentTabs: Array<{ id: Segment; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'vip', label: 'VIP' },
    { id: 'active', label: 'Active' },
    { id: 'new', label: 'New (30d)' },
    { id: 'at-risk', label: 'At Risk' },
  ]

  return (
    <div className="p-6 sm:p-8">
      {/* HEADER */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          CRM
        </p>
        <h1 className="mt-2 text-3xl font-bold">Customers</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Segment customers by activity, revenue, and engagement.
        </p>
      </div>

      {/* STATS */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    {s.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{s.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* SEARCH */}
      <form method="GET" className="mb-6 flex max-w-md gap-2">
        {segment !== 'all' && <input type="hidden" name="segment" value={segment} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search by name, email or phone..."
            className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] ps-10 pe-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <button
          type="submit"
          className="min-h-[44px] rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
        >
          Search
        </button>
      </form>

      {/* SEGMENT TABS */}
      <div className="mb-6 flex flex-wrap gap-2">
        {segmentTabs.map((t) => {
          const active = segment === t.id
          const count =
            t.id === 'all'
              ? all.length
              : enriched.filter((c) => c.segments.includes(t.id)).length
          return (
            <Link
              key={t.id}
              href={t.id === 'all' ? '/admin/customers' : `/admin/customers?segment=${t.id}`}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)]/50'
              }`}
            >
              {t.label} ({count})
            </Link>
          )
        })}
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <p className="mt-4 font-semibold">No customers in this segment</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Try a different filter or search query.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 transition hover:bg-[var(--muted)]/30"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
                    {(c.full_name ?? c.email ?? 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">
                        {c.full_name ?? 'Unnamed'}
                      </p>
                      {c.is_blacklisted && (
                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                          Blacklisted
                        </span>
                      )}
                      {c.segments.includes('vip') && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                          <Crown className="h-2.5 w-2.5" />
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                      {c.email ?? '—'} · Joined {formatDate(c.joined_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      Bookings
                    </p>
                    <p className="mt-0.5 font-bold tabular-nums">{c.total_bookings ?? 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      Revenue
                    </p>
                    <p className="mt-0.5 font-bold tabular-nums text-[var(--accent)]">
                      {formatAED(Number(c.total_revenue ?? 0))}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}