import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Star } from 'lucide-react'
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

  // Table may not exist on older DBs — fail soft.
  if (reviewRows) reviews = reviewRows as ReviewRow[]

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 min-h-screen bg-[var(--background)]">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Ratings & Reviews</p>
      <h1 className="mt-2 text-3xl font-bold">Rate your rental</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">Reviews are collected after each rental period and help other renters.</p>

      <div className="mt-8">
        <ReviewForm bookings={(bookings ?? []) as BookingRow[]} />
      </div>

      <div className="mt-8 space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            <Star className="mx-auto h-8 w-8" />
            <p className="mt-3">No reviews yet. Submit your first review above.</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="font-semibold">{'★'.repeat(Number(r.rating) || 0)} ({r.rating}/5)</p>
              <p className="mt-1 text-sm">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
