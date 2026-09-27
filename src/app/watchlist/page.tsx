import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Car, Heart, ChevronRight } from 'lucide-react'
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Saved Cars
        </p>
        <h1 className="mt-2 text-3xl font-bold">My Watchlist</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Cars you saved for later. Book them anytime.
        </p>
      </div>

      {!items || items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <h2 className="mt-4 text-lg font-semibold">Your watchlist is empty</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Save cars you like and compare them later.
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const v = Array.isArray(item.vehicles) ? item.vehicles[0] : item.vehicles
            if (!v) return null

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--accent)]/50"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-[var(--muted)]">
                  <Car className="h-12 w-12 text-[var(--muted-foreground)]" />
                  <div className="absolute right-3 top-3">
                    <RemoveButton vehicleId={v.id} />
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold">
                    {v.make} {v.model}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {v.year ?? ''}
                    {v.category ? ` · ${v.category}` : ''}
                    {v.location ? ` · ${v.location}` : ''}
                  </p>

                  <div className="mt-3 flex justify-end border-t border-[var(--border)] pt-3">
                    <Link
                      href={`/cars/${v.id}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
                    >
                      View
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}