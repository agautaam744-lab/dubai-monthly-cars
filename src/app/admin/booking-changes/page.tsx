import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import {
  CalendarClock,
  XCircle,
  Car,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { ChangeActions } from './ChangeActions'

function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatRelative(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof CalendarClock; color: string }> = {
  extension: {
    label: 'Extension',
    icon: TrendingUp,
    color: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
  },
  termination: {
    label: 'Early Termination',
    icon: XCircle,
    color: 'border-red-500/30 bg-red-500/10 text-red-700',
  },
  swap: {
    label: 'Vehicle Swap',
    icon: Car,
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  },
}

export default async function AdminBookingChangesPage() {
  const { supabase } = await requireAdmin()

  const { data: changes } = await supabase
    .from('booking_changes')
    .select(`
      id,
      booking_id,
      change_type,
      status,
      reason,
      metadata,
      reviewed_at,
      reviewed_by,
      rejection_reason,
      created_at,
      bookings (
        id,
        start_date,
        end_date,
        monthly_price_aed,
        status,
        vehicles ( make, model )
      ),
      profiles:requested_by ( full_name, email, phone )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const allChanges = changes ?? []
  const pending = allChanges.filter((c) => c.status === 'pending')
  const processed = allChanges.filter((c) => c.status !== 'pending')

  const stats = [
    {
      label: 'Pending Requests',
      value: pending.length,
      icon: Clock,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      label: 'Extensions',
      value: allChanges.filter((c) => c.change_type === 'extension').length,
      icon: TrendingUp,
      color: 'text-sky-500 bg-sky-500/10',
    },
    {
      label: 'Terminations',
      value: allChanges.filter((c) => c.change_type === 'termination').length,
      icon: XCircle,
      color: 'text-red-500 bg-red-500/10',
    },
    {
      label: 'Swaps',
      value: allChanges.filter((c) => c.change_type === 'swap').length,
      icon: Car,
      color: 'text-amber-500 bg-amber-500/10',
    },
  ]

  return (
    <div className="p-6 sm:p-8">
      {/* HEADER */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Rental Management
        </p>
        <h1 className="mt-2 text-3xl font-bold">Booking Changes</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Review and approve customer requests for extensions, terminations, and vehicle swaps.
        </p>
      </div>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* PENDING */}
      <div className="mt-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Pending Requests</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {pending.length} request{pending.length === 1 ? '' : 's'} awaiting review
            </p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-3 font-semibold">All caught up</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              No pending requests right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((change) => {
              const config = TYPE_CONFIG[change.change_type] ?? TYPE_CONFIG.extension
              const Icon = config.icon
              const booking = Array.isArray(change.bookings) ? change.bookings[0] : change.bookings
              const vehicle = firstOrSelf(booking?.vehicles)
              const customer = Array.isArray(change.profiles) ? change.profiles[0] : change.profiles

              return (
                <div
                  key={change.id}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] p-5">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {formatRelative(change.created_at)}
                          </span>
                        </div>
                        <p className="mt-2 font-semibold">
                          {vehicle?.make} {vehicle?.model}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {customer?.full_name ?? customer?.email ?? 'Customer'} · Booking #{change.booking_id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/bookings/${change.booking_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      View Booking
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="space-y-3 p-5">
                    {change.reason && (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                          Reason
                        </p>
                        <p className="mt-1">{change.reason}</p>
                      </div>
                    )}

                    {change.metadata && Object.keys(change.metadata as object).length > 0 && (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                          Details
                        </p>
                        <pre className="mt-1 overflow-x-auto text-xs text-[var(--foreground)]/80">
                          {JSON.stringify(change.metadata, null, 2)}
                        </pre>
                      </div>
                    )}

                    <ChangeActions changeId={change.id} changeType={change.change_type} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* PROCESSED */}
      {processed.length > 0 && (
        <div className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Recent Decisions</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {processed.length} processed request{processed.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <div className="divide-y divide-[var(--border)]">
              {processed.slice(0, 10).map((change) => {
                const config = TYPE_CONFIG[change.change_type] ?? TYPE_CONFIG.extension
                const booking = Array.isArray(change.bookings) ? change.bookings[0] : change.bookings
                const vehicle = firstOrSelf(booking?.vehicles)

                return (
                  <div
                    key={change.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {config.label} · {vehicle?.make} {vehicle?.model}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        Reviewed {formatRelative(change.reviewed_at ?? change.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                        change.status === 'approved'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                          : change.status === 'rejected'
                            ? 'border-red-500/20 bg-red-500/10 text-red-600'
                            : 'border-gray-500/20 bg-gray-500/10 text-gray-600'
                      }`}
                    >
                      {change.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}