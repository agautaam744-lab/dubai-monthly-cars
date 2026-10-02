'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Loader2, Check, AlertCircle, Sparkles, Car, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { BookingRow } from '@/types/database'
import { first } from '@/types/database'

export default function ReviewForm({ bookings }: { bookings: BookingRow[] }) {
  const router = useRouter()
  const [bookingId, setBookingId] = useState(bookings[0]?.id ?? '')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingId) {
      setError('Please select a booking first.')
      return
    }
    setLoading(true)
    setMsg('')
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { error: insertError } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        customer_id: user.id,
        rating,
        comment: comment.trim() || null,
      })
      if (insertError) throw insertError
      setMsg('Thanks! Your review was submitted successfully.')
      setComment('')
      setRating(5)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not submit review. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const labelClass =
    'mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]'

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/30 p-6 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          You don&rsquo;t have any completed rentals yet. Reviews can be submitted after your first rental.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Booking selector */}
      <div>
        <label className={labelClass}>
          <Car className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          Select Booking
        </label>
        <select
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]"
        >
          {bookings.map((b) => {
            const v = first(b.vehicles ?? null)
            return (
              <option key={b.id} value={b.id}>
                {v ? `${v.make} ${v.model}` : b.id.slice(0, 8)} · {b.status}
              </option>
            )
          })}
        </select>
      </div>

      {/* Star rating */}
      <div>
        <label className={labelClass}>
          <Star className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          Your Rating
          <span className="ms-auto text-[10px] normal-case tracking-normal text-[var(--muted-foreground)]">
            {rating}/5
          </span>
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
          {[1, 2, 3, 4, 5].map((s) => {
            const active = s <= (hoverRating || rating)
            return (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${s} out of 5`}
                className="group/star flex h-11 w-11 items-center justify-center rounded-xl transition-all hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 transition-all duration-200 ${
                    active
                      ? 'fill-[var(--accent)] text-[var(--accent)] drop-shadow-[0_0_8px_rgba(201,162,39,0.3)]'
                      : 'text-[var(--muted-foreground)]/30 hover:text-[var(--accent)]/50'
                  }`}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className={labelClass}>
          <MessageSquare className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          Your Review
          <span className="ms-auto text-[10px] normal-case tracking-normal text-[var(--muted-foreground)]">
            {comment.length} chars
          </span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="How was the car and service? Any tips for other renters?"
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm leading-6 outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Success / Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {msg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600">
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-semibold">{msg}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="group flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl hover:shadow-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Submitting...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Submit Review
          </>
        )}
      </button>

      {/* Trust note */}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">
          Your review helps other renters choose with confidence. Reviews are public and cannot be edited after submission.
        </p>
      </div>
    </form>
  )
}