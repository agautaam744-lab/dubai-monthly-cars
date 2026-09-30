'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ChangeKind = 'extension' | 'termination' | 'swap'

export async function toggleAutoRenew(bookingId: string, value: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { error } = await supabase
    .from('bookings')
    .update({ auto_renew: value, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('customer_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function requestBookingChange(
  bookingId: string,
  kind: ChangeKind,
  details: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .single()

  if (!booking) return { ok: false, error: 'Booking not found' }
  if (['cancelled', 'completed', 'terminated'].includes(String(booking.status))) {
    return { ok: false, error: 'This booking is closed and cannot be changed.' }
  }

  const labels: Record<ChangeKind, string> = {
    extension: 'Extension',
    termination: 'Early termination',
    swap: 'Vehicle swap / upgrade',
  }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      customer_id: user.id,
      subject: `[${labels[kind]}] Booking #${bookingId.slice(0, 8).toUpperCase()}`,
      priority: kind === 'termination' ? 'high' : 'normal',
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !ticket) {
    return { ok: false, error: error?.message ?? 'Could not create request' }
  }

  await supabase.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    message: `Request type: ${kind}\nBooking: ${bookingId}\nDetails: ${details.trim() || '—'}`,
  })

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath('/support')
  return { ok: true, ticketId: ticket.id }
}
