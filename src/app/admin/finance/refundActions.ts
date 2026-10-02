'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: boolean; error?: string }

export async function processRefund({
  bookingId,
  originalPaymentId,
  amount,
  reason,
  method,
}: {
  bookingId: string
  originalPaymentId: string | null
  amount: number
  reason: string
  method: 'wallet' | 'bank_transfer' | 'original_method'
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'finance', 'fleet_manager']
  if (!profile || !adminRoles.includes(profile.role)) {
    return { ok: false, error: 'Access denied' }
  }

  if (!reason.trim()) {
    return { ok: false, error: 'Refund reason is required' }
  }

  if (amount <= 0) {
    return { ok: false, error: 'Refund amount must be greater than zero' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, customer_id, deposit_aed')
    .eq('id', bookingId)
    .single()

  if (!booking) return { ok: false, error: 'Booking not found' }

  const { error: insertError } = await supabase
    .from('payments')
    .insert({
      booking_id: bookingId,
      customer_id: booking.customer_id,
      amount_aed: amount,
      type: 'refund',
      status: 'succeeded',
      provider: method,
      paid_at: new Date().toISOString(),
      refund_reason: reason.trim(),
      refund_method: method,
      refund_processed_by: user.id,
      refunded_at: new Date().toISOString(),
      original_payment_id: originalPaymentId,
    })

  if (insertError) return { ok: false, error: insertError.message }

  await supabase.from('notifications').insert({
    user_id: booking.customer_id,
    title: 'Refund processed',
    body: `AED ${amount.toLocaleString()} refund processed via ${method.replace('_', ' ')}. ${reason}`,
    type: 'payment',
    link: '/profile',
  })

  revalidatePath('/admin/finance')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/dashboard')
  revalidatePath('/profile')

  return { ok: true }
}