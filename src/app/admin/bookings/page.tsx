import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { CalendarCheck, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Bookings Management | Dubai Monthly Cars',
}

const statusStyles: Record<string, string> = {
  pending_kyc: 'bg-yellow-500/10 text-yellow-600',
  pending_agreement: 'bg-orange-500/10 text-orange-600',
  pending_payment: 'bg-blue-500/10 text-blue-600',
  active: 'bg-green-500/10 text-green-600',
  completed: 'bg-gray-500/10 text-gray-600',
  cancelled: 'bg-red-500/10 text-red-600',
  terminated: 'bg-red-500/10 text-red-600',
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { supabase } = await requireAdmin()
  const params = await searchParams
  const statusFilter = params.status ?? ''

  let query = supabase
    .from('bookings')
    .select(`
      id, status, start_date, end_date, duration_months, monthly_price_aed, created_at,
      vehicles ( make, model, plate_number ),
      profiles:customer_id ( full_name, email )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: bookings, error } = await query

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>
  }

  const all = bookings ?? []

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Rental Operations</p>
        <h1 className="mt-2 text-3xl font-bold">Bookings Management</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">View, approve, extend, terminate or swap active rentals.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'pending_kyc', 'pending_agreement', 'pending_payment', 'active', 'completed', 'cancelled'].map((s) => (
          <Link
            key={s || 'all'}
            href={s ? `/admin/bookings?status=${s}` : '/admin/bookings'}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusFilter === s ? 'bg-[var(--accent)] text-white' : 'bg-[var(--muted)] text-[var(--foreground)]'}`}
          >
            {s ? s.replace(/_/g, ' ') : 'All'}
          </Link>
        ))}
      </div>

      {all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <p className="mt-4 font-semibold">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {all.map((b: any) => {
            const v = Array.isArray(b.vehicles) ? b.vehicles[0] : b.vehicles
            const c = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles
            return (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]/50">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{v?.make} {v?.model}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[b.status] ?? 'bg-gray-500/10'}`}>{String(b.status).replace(/_/g, ' ')}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">{c?.full_name ?? c?.email ?? 'Unknown'} · {b.duration_months} mo · AED {Number(b.monthly_price_aed || 0).toLocaleString()}/mo</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
