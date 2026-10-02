import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  ChevronRight,
  Calendar,
  Car,
  Plus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

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
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Incident Reports
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            Damage Reports
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            Report any damage or incidents with your rental vehicle. We review every report and apply charges fairly against your deposit.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {!bookings || bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/20">
              <AlertTriangle className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-serif text-2xl tracking-tight">
              No active bookings
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
              Damage reports are available once you have an active booking.
            </p>
            <Link
              href="/cars"
              className="group mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5"
            >
              Browse Cars
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const vehicle = Array.isArray(booking.vehicles)
                ? booking.vehicles[0]
                : booking.vehicles
              if (!vehicle) return null

              const count = reportCount(booking.id)

              return (
                <div
                  key={booking.id}
                  className="group overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5"
                >
                  <div className="flex items-start gap-4 border-b border-[var(--border)] p-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--muted)]/40">
                      <Car className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-2xl tracking-tight">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="mt-1.5 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                        <Calendar className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                        Started{' '}
                        {new Date(booking.start_date).toLocaleDateString('en-AE', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
                        #{booking.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <Link
                      href={`/damage-report/${booking.id}`}
                      className={[
                        'group/btn flex items-center justify-between gap-4 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md',
                        count > 0
                          ? 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50'
                          : 'border-red-500/30 bg-red-500/5 hover:border-red-500/50',
                      ].join(' ')}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={[
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                            count > 0 ? 'bg-[var(--accent)]/10' : 'bg-red-500/10',
                          ].join(' ')}
                        >
                          {count > 0 ? (
                            <ShieldCheck className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-lg tracking-tight">
                            {count > 0 ? 'View Reports' : 'Report Damage'}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                            {count > 0
                              ? `${count} report${count > 1 ? 's' : ''} submitted`
                              : 'File a new damage report'}
                          </p>
                        </div>
                      </div>
                      {count > 0 ? (
                        <ChevronRight
                          className="h-5 w-5 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:text-[var(--accent)] rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5"
                          aria-hidden="true"
                        />
                      ) : (
                        <Plus
                          className="h-5 w-5 shrink-0 text-red-600 transition-transform group-hover/btn:scale-110"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}