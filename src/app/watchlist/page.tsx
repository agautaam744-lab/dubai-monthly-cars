import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Car,
  Heart,
  ChevronRight,
  Sparkles,
  ArrowRight,
  MapPin,
  Gauge,
} from 'lucide-react'
import RemoveButton from './RemoveButton'

export default async function WatchlistPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/watchlist')

  const { data: items } = await supabase
    .from('watchlist')
    .select(`
      id,
      vehicle_id,
      created_at,
      vehicles (
        id, make, model, year, category, location, status
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const total = items?.length ?? 0

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Saved Cars
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            My Watchlist
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            {total > 0
              ? `You have ${total} car${total === 1 ? '' : 's'} saved. Compare them and book whenever you're ready.`
              : 'Cars you save for later will appear here. Book them anytime.'}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {!items || items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/20">
              <Heart className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-serif text-2xl tracking-tight">
              Your watchlist is empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
              Save cars you like and compare them later. Tap the heart icon on any car to save it.
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const v = Array.isArray(item.vehicles) ? item.vehicles[0] : item.vehicles
              if (!v) return null

              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--accent)]/40 hover:shadow-2xl hover:shadow-[var(--accent)]/10"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--muted)] to-[var(--card)]">
                    <Car
                      className="h-16 w-16 text-[var(--accent)]/25 transition-transform duration-500 group-hover:scale-110"
                      aria-hidden="true"
                    />

                    {/* Category badge (top-left) */}
                    {v.category && (
                      <span className="absolute start-3 top-3 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                        {v.category}
                      </span>
                    )}

                    {/* Remove button (top-right) */}
                    <div className="absolute end-3 top-3">
                      <RemoveButton vehicleId={v.id} />
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif text-xl tracking-tight">
                      {v.make} {v.model}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)]">
                      {v.year && (
                        <span className="inline-flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                          {v.year}
                        </span>
                      )}
                      {v.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                          {v.location}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/cars/${v.id}`}
                      className="group/btn mt-5 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-sm shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-md hover:shadow-[var(--accent)]/30"
                    >
                      View Details
                      <ChevronRight
                        className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5"
                        aria-hidden="true"
                      />
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