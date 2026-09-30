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

export async function extendBooking(bookingId: string, extraMonths: number) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) {
    return { ok: false, error: 'Access denied' }
  }

  if (![1, 3, 6, 12].includes(extraMonths)) {
    return { ok: false, error: 'Extension must be 1, 3, 6 or 12 months.' }
  }

  const { data: booking, error: fetchError } = await check.supabase
    .from('bookings')
    .select('id, end_date, duration_months')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) return { ok: false, error: 'Booking not found' }

  const base = booking.end_date ? new Date(booking.end_date) : new Date()
  base.setMonth(base.getMonth() + extraMonths)
  const newEnd = base.toISOString().slice(0, 10)

  const { error } = await check.supabase
    .from('bookings')
    .update({
      end_date: newEnd,
      duration_months: Number(booking.duration_months || 0) + extraMonths,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  return { ok: true, endDate: newEnd }
}

export async function terminateBooking(bookingId: string) {
  return updateBookingStatus(bookingId, 'terminated')
}

export async function swapBookingVehicle(bookingId: string, newVehicleId: string) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) {
    return { ok: false, error: 'Access denied' }
  }

  const { data: vehicle } = await check.supabase
    .from('vehicles')
    .select('id, status')
    .eq('id', newVehicleId)
    .single()

  if (!vehicle) return { ok: false, error: 'Replacement vehicle not found' }
  if (vehicle.status !== 'available') {
    return { ok: false, error: 'Replacement vehicle is not available.' }
  }

  const { data: booking } = await check.supabase
    .from('bookings')
    .select('id, vehicle_id')
    .eq('id', bookingId)
    .single()

  if (!booking) return { ok: false, error: 'Booking not found' }

  const { error } = await check.supabase
    .from('bookings')
    .update({ vehicle_id: newVehicleId, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) return { ok: false, error: error.message }

  // Free the old vehicle, mark the new one rented
  await check.supabase.from('vehicles').update({ status: 'available' }).eq('id', booking.vehicle_id)
  await check.supabase.from('vehicles').update({ status: 'rented' }).eq('id', newVehicleId)

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  return { ok: true }
}