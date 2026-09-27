'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const adminRoles = ['super_admin', 'fleet_manager', 'finance', 'support']

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !adminRoles.includes(profile.role)) {
    return { ok: false, supabase: null }
  }

  return { ok: true, supabase }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) {
    return { ok: false, error: 'Access denied' }
  }

  const { error } = await check.supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)

  return { ok: true }
}