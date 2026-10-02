'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: boolean; error?: string }

export async function approveChange(
  changeId: string,
  changeType: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'fleet_manager', 'support']
  if (!profile || !adminRoles.includes(profile.role)) {
    return { ok: false, error: 'Access denied' }
  }

  const { data: change, error: fetchError } = await supabase
    .from('booking_changes')
    .select('id, booking_id, change_type, metadata, requested_by')
    .eq('id', changeId)
    .single()

  if (fetchError || !change) {
    return { ok: false, error: 'Request not found' }
  }

  const { error: updateError } = await supabase
    .from('booking_changes')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', changeId)

  if (updateError) return { ok: false, error: updateError.message }

  // Apply the change based on type
  const meta = (change.metadata ?? {}) as Record<string, unknown>

  if (change.change_type === 'extension' && meta.new_end_date) {
    await supabase
      .from('bookings')
      .update({
        end_date: String(meta.new_end_date),
        duration_months: Number(meta.new_duration_months ?? 0) || undefined,
      })
      .eq('id', change.booking_id)
  }

  if (change.change_type === 'termination') {
    await supabase
      .from('bookings')
      .update({ status: 'terminated' })
      .eq('id', change.booking_id)
  }

  if (change.change_type === 'swap' && meta.new_vehicle_id) {
    await supabase
      .from('bookings')
      .update({ vehicle_id: String(meta.new_vehicle_id) })
      .eq('id', change.booking_id)
  }

  // Notify customer
  await supabase.from('notifications').insert({
    user_id: change.requested_by,
    title: 'Change request approved',
    body: `Your ${change.change_type} request has been approved.`,
    type: 'booking',
    link: `/bookings/${change.booking_id}`,
  })

  revalidatePath('/admin/booking-changes')
  revalidatePath(`/bookings/${change.booking_id}`)

  return { ok: true }
}

export async function rejectChange(
  changeId: string,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'fleet_manager', 'support']
  if (!profile || !adminRoles.includes(profile.role)) {
    return { ok: false, error: 'Access denied' }
  }

  const { data: change } = await supabase
    .from('booking_changes')
    .select('booking_id, change_type, requested_by')
    .eq('id', changeId)
    .single()

  if (!change) return { ok: false, error: 'Request not found' }

  const { error } = await supabase
    .from('booking_changes')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', changeId)

  if (error) return { ok: false, error: error.message }

  await supabase.from('notifications').insert({
    user_id: change.requested_by,
    title: 'Change request rejected',
    body: `Your ${change.change_type} request was rejected. Reason: ${reason}`,
    type: 'booking',
    link: `/bookings/${change.booking_id}`,
  })

  revalidatePath('/admin/booking-changes')
  revalidatePath(`/bookings/${change.booking_id}`)

  return { ok: true }
}