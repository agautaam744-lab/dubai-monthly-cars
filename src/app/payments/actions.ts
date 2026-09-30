'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Result = { ok: true; bookingId: string } | { ok: false; error: string }

export async function completeMockPayment(bookingId: string): Promise<Result> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be logged in to pay.' }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      'id, status, customer_id, monthly_price_aed, deposit_aed, total_add_ons_aed, duration_months, start_date'
    )
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .single()

  if (bookingError || !booking) {
    return { ok: false, error: 'Booking not found.' }
  }

  if (booking.status === 'active') {
    return { ok: false, error: 'This booking is already active.' }
  }

  if (booking.status === 'cancelled') {
    return { ok: false, error: 'This booking has been cancelled.' }
  }

  const now = new Date().toISOString()
  const depositAmount = Number(booking.deposit_aed || 0)
  const rentAmount =
    Number(booking.monthly_price_aed || 0) +
    Number(booking.total_add_ons_aed || 0)

  const paymentsToInsert: {
    booking_id: string
    customer_id: string
    amount_aed: number
    type: string
    status: string
    provider: string
    provider_payment_id: string
    paid_at: string
  }[] = []

  if (depositAmount > 0) {
    paymentsToInsert.push({
      booking_id: booking.id,
      customer_id: user.id,
      amount_aed: depositAmount,
      type: 'deposit',
      status: 'succeeded',
      provider: 'mock',
      provider_payment_id: `mock_dep_${Date.now()}`,
      paid_at: now,
    })
  }

  if (rentAmount > 0) {
    paymentsToInsert.push({
      booking_id: booking.id,
      customer_id: user.id,
      amount_aed: rentAmount,
      type: 'monthly_rental',
      status: 'succeeded',
      provider: 'mock',
      provider_payment_id: `mock_rent_${Date.now()}`,
      paid_at: now,
    })
  }

  if (paymentsToInsert.length > 0) {
    const { error: paymentError } = await supabase
      .from('payments')
      .insert(paymentsToInsert)

    if (paymentError) {
      return { ok: false, error: paymentError.message }
    }
  }

  // Schedule next month as pending so recurring cron picks it up (multi-month only).
  const durationMonths = Number((booking as { duration_months?: number }).duration_months ?? 1)
  if (durationMonths > 1) {
    const nextDue = new Date()
    nextDue.setMonth(nextDue.getMonth() + 1)
    await supabase.from('payments').insert({
      booking_id: booking.id,
      customer_id: user.id,
      amount_aed: Number(booking.monthly_price_aed || 0),
      type: 'monthly_rental',
      status: 'pending',
      provider: 'mock',
      provider_payment_id: `mock_sched_${Date.now()}`,
      due_date: nextDue.toISOString().slice(0, 10),
    })
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'active', updated_at: now })
    .eq('id', booking.id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  revalidatePath('/payments')

  return { ok: true, bookingId: booking.id }
}