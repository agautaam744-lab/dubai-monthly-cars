import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertTriangle, ChevronRight, Calendar, Car, Plus } from 'lucide-react'

export default async function DamageReportListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/damage-report')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      vehicles ( make, model, year )
    `)
    .eq('customer_id', user.id)
    .in('status', ['active', 'completed', 'pending_payment'])
    .order('created_at', { ascending: false })

  const { data: reports } = await supabase
    .from('damage_reports')
    .select('id, booking_id, status, created_at')
    .eq('created_by', user.id)

  const reportCount = (bookingId: string) =>
    reports?.filter((r) => r.booking_id === bookingId).length ?? 0

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Incident Reports
        </p>
        <h1 className="mt-2 text-3xl font-bold">Damage Reports</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Report any damage or incidents with your rental vehicle.
        </p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <h2 className="mt-4 text-lg font-semibold">No active bookings</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Damage reports are available once you have an active booking.
          </p>
          <Link
            href="/cars"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            Browse Cars
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((booking) => {
            const vehicle = Array.isArray(booking.vehicles)
              ? booking.vehicles[0]
              : booking.vehicles
            if (!vehicle) return null

            const count = reportCount(booking.id)

            return (
              <div
                key={booking.id}
                className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]"
              >
                <div className="flex items-start gap-4 border-b border-[var(--border)] p-5 sm:p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                    <Car className="h-6 w-6 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <Calendar className="h-3 w-3" />
                      Start:{' '}
                      {new Date(booking.start_date).toLocaleDateString('en-AE', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
                      Booking #{booking.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <Link
                    href={`/damage-report/${booking.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 transition hover:border-[var(--accent)]/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {count > 0 ? 'View Reports' : 'Report Damage'}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {count > 0
                            ? `${count} report${count > 1 ? 's' : ''} submitted`
                            : 'File a new damage report'}
                        </p>
                      </div>
                    </div>
                    {count > 0 ? (
                      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition group-hover:text-[var(--accent)]" />
                    ) : (
                      <Plus className="h-4 w-4 text-[var(--muted-foreground)] transition group-hover:text-[var(--accent)]" />
                    )}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
