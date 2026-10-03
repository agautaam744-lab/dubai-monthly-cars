'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ActionResult = { ok: boolean; error?: string }

export async function createChangeRequest({
  bookingId,
  changeType,
  reason,
  metadata,
}: {
  bookingId: string
  changeType: 'extension' | 'termination' | 'swap'
  reason: string
  metadata: Record<string, unknown>
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, customer_id, status')
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .single()

  if (!booking) return { ok: false, error: 'Booking not found' }
  if (!['active', 'pending_payment', 'pending_agreement'].includes(booking.status)) {
    return { ok: false, error: 'Booking is not eligible for changes' }
  }

  const { data: existing } = await supabase
    .from('booking_changes')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: 'You already have a pending change request for this booking.' }
  }

  const { error } = await supabase.from('booking_changes').insert({
    booking_id: bookingId,
    requested_by: user.id,
    change_type: changeType,
    reason: reason.trim(),
    metadata,
    status: 'pending',
  })

  if (error) return { ok: false, error: error.message }

  const adminDb = createAdminClient()
  const { data: admins } = await adminDb
    .from('profiles')
    .select('id')
    .in('role', ['super_admin', 'fleet_manager', 'support'])

  for (const admin of admins ?? []) {
    await adminDb.from('notifications').insert({
      user_id: admin.id,
      title: `New ${changeType} request`,
      body: `A customer requested a ${changeType}. Review and approve.`,
      type: 'booking',
      link: '/admin/booking-changes',
    })
  }

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath('/admin/booking-changes')

  return { ok: true }
}