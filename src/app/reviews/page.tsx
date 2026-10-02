import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Star, Sparkles, MessageSquare, TrendingUp } from 'lucide-react'
import ReviewForm from './ReviewForm'
import type { BookingRow } from '@/types/database'

export const metadata = { title: 'Ratings & Reviews | Dubai Monthly Cars' }

interface ReviewRow {
  id: string
  booking_id?: string | null
  rating?: number | null
  comment?: string | null
  created_at?: string
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= rating
              ? 'fill-[var(--accent)] text-[var(--accent)]'
              : 'text-[var(--muted-foreground)]/30'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/reviews')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, vehicles ( make, model )')
    .eq('customer_id', user.id)
    .in('status', ['completed', 'active'])
    .order('created_at', { ascending: false })
    .limit(10)

  let reviews: ReviewRow[] = []
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('id, booking_id, rating, comment, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (reviewRows) reviews = reviewRows as ReviewRow[]

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / reviews.length
      : 0

  const formatDate = (d: string | null | undefined) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Ratings & Reviews
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            Rate your rental
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            Reviews are collected after each rental period and help other renters choose with confidence.
          </p>

          {/* Stats bar */}
          {reviews.length > 0 && (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  <Star className="h-3 w-3 text-[var(--accent)]" aria-hidden="true" />
                  Average
                </div>
                <p className="mt-1.5 font-serif text-2xl tracking-tight tabular-nums text-[var(--accent)]">
                  {avgRating.toFixed(1)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  <MessageSquare className="h-3 w-3 text-[var(--accent)]" aria-hidden="true" />
                  Total
                </div>
                <p className="mt-1.5 font-serif text-2xl tracking-tight tabular-nums">
                  {reviews.length}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/60 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  <TrendingUp className="h-3 w-3 text-[var(--accent)]" aria-hidden="true" />
                  Status
                </div>
                <p className="mt-1.5 font-serif text-2xl tracking-tight">
                  {avgRating >= 4 ? 'Excellent' : avgRating >= 3 ? 'Good' : 'Growing'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {/* FORM */}
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--border)] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Star className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-xl tracking-tight">
                Write a review
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Rate your completed rentals
              </p>
            </div>
          </div>
          <div className="p-6">
            <ReviewForm bookings={(bookings ?? []) as BookingRow[]} />
          </div>
        </div>

        {/* EXISTING REVIEWS */}
        <div className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <MessageSquare className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl tracking-tight">
                Your reviews
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {reviews.length} review{reviews.length === 1 ? '' : 's'} submitted
              </p>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/20">
                <Star className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-serif text-2xl tracking-tight">
                No reviews yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
                Submit your first review above. It only takes a minute and helps other renters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="group rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <StarRow rating={Number(r.rating) || 0} />
                    <p className="text-xs font-medium tabular-nums text-[var(--muted-foreground)]">
                      {Number(r.rating) || 0}/5
                    </p>
                  </div>

                  {r.comment && (
                    <p className="mt-4 text-sm leading-6 text-[var(--foreground)]/80">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}

                  {r.created_at && (
                    <p className="mt-4 text-xs text-[var(--muted-foreground)]">
                      {formatDate(r.created_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}