'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createPaymentIntent, refundPayment as refundPaymentService, retryFailedPayment as retryFailedPaymentService } from './payment-service'

type Result = { ok: true; bookingId: string; sessionId?: string; url?: string; clientSecret?: string } | { ok: false; error: string }

export async function completePayment(
  bookingId: string,
  options: {
    provider: 'stripe' | 'tabby' | 'apple_pay' | 'google_pay'
    amountAed: number
    returnUrl: string
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'You must be logged in to pay.' }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, customer_id, monthly_price_aed, deposit_aed, total_add_ons_aed, duration_months, start_date')
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

  const depositAmount = Number(booking.deposit_aed || 0)
  const rentAmount = Number(booking.monthly_price_aed || 0) + Number(booking.total_add_ons_aed || 0)
  const totalAmount = depositAmount + rentAmount

  if (options.amountAed !== totalAmount) {
    return { ok: false, error: 'Amount mismatch' }
  }

  const result = await createPaymentIntent({
    bookingId,
    amountAed: totalAmount,
    currency: 'AED',
    provider: options.provider,
    returnUrl: options.returnUrl,
    customerEmail: (await supabase.auth.getUser()).data.user?.email || '',
    customerName: (await supabase.from('profiles').select('full_name').eq('id', user.id).single()).data?.full_name || '',
    metadata: {
      booking_id: bookingId,
      deposit_amount: depositAmount.toString(),
      rent_amount: rentAmount.toString()
    }
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  revalidatePath('/bookings')
  revalidatePath('/dashboard')
  revalidatePath('/payments')

  return { ok: true, bookingId, sessionId: result.sessionId, url: result.url, clientSecret: result.clientSecret }
}

// Keep mock payment for testing/fallback
export async function completeMockPayment(bookingId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'You must be logged in to pay.' }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, customer_id, monthly_price_aed, deposit_aed, total_add_ons_aed')
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
  const rentAmount = Number(booking.monthly_price_aed || 0) + Number(booking.total_add_ons_aed || 0)

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

export async function refundPayment(paymentId: string) {
  return refundPaymentService(paymentId)
}

export async function retryFailedPayment(paymentId: string) {
  return retryFailedPaymentService(paymentId)
}

export async function createPaymentSession(
  bookingId: string,
  provider: 'stripe' | 'tabby',
  returnUrl: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { ok: false, error: 'Not authenticated' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, customer_id, monthly_price_aed, deposit_aed, total_add_ons_aed')
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .single()

  if (!booking) {
    return { ok: false, error: 'Booking not found' }
  }

  const depositAmount = Number(booking.deposit_aed || 0)
  const rentAmount = Number(booking.monthly_price_aed || 0) + Number(booking.total_add_ons_aed || 0)
  const totalAmount = depositAmount + rentAmount

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const result = await createPaymentIntent({
    bookingId,
    amountAed: totalAmount,
    currency: 'AED',
    provider,
    returnUrl,
    customerEmail: user.email || '',
    customerName: profile?.full_name || '',
    metadata: {
      booking_id: bookingId,
      deposit_amount: depositAmount.toString(),
      rent_amount: rentAmount.toString()
    }
  })

  return result
}