'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BookingRow } from '@/types/database'
import { first } from '@/types/database'

export default function ReviewForm({ bookings }: { bookings: BookingRow[] }) {
  const [bookingId, setBookingId] = useState(bookings[0]?.id ?? '')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingId) {
      setMsg('Select a booking first.')
      return
    }
    setLoading(true)
    setMsg('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')
      const { error } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        customer_id: user.id,
        rating,
        comment: comment.trim() || null,
      })
      if (error) throw error
      setMsg('Thanks! Your review was submitted.')
      setComment('')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not submit review. The reviews table may not exist yet — run the latest schema SQL.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
      <label className="block text-sm">
        <span className="mb-2 block font-medium">Booking</span>
        <select value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="min-h-[46px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3">
          {bookings.map((b) => {
            const v = first(b.vehicles ?? null)
            return <option key={b.id} value={b.id}>{v ? `${v.make} ${v.model}` : b.id.slice(0, 8)} · {b.status}</option>
          })}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-2 block font-medium">Rating (1–5)</span>
        <input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="min-h-[46px] w-32 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3" required />
      </label>
      <label className="block text-sm">
        <span className="mb-2 block font-medium">Comment</span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="How was the car and service?" className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3" />
      </label>
      <button disabled={loading} className="flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white disabled:opacity-50">
        {loading ? 'Submitting…' : 'Submit review'}
      </button>
      {msg && <p className="text-sm text-[var(--muted-foreground)]">{msg}</p>}
    </form>
  )
}
