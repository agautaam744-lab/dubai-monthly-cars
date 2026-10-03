import 'server-only'

import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

type PaymentRow = {
  booking_id: string
  customer_id: string
  amount_aed: number
  type: 'deposit' | 'monthly_rental'
  status: 'succeeded' | 'pending'
  provider: 'stripe'
  provider_payment_id: string
  paid_at?: string
  due_date?: string
}

export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object)
      break
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
    default:
      break
  }
}

// Unique index on payments.provider_payment_id makes retries safe:
// a duplicate insert (code 23505) means "already processed".
async function insertPayment(supabase: AdminClient, row: PaymentRow) {
  const { error } = await supabase.from('payments').insert(row)
  if (error && error.code !== '23505') {
    throw new Error(`payments insert failed: ${error.message}`)
  }
}

async function notifyCustomer(
  supabase: AdminClient,
  userId: string,
  title: string,
  body: string
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body,
    type: 'payment',
    link: '/bookings',
  })
  if (error) console.error('[stripe-webhook] notification failed:', error.message)
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const bookingId = pi.metadata?.booking_id
  if (!bookingId) {
    console.warn('[stripe-webhook] payment_intent without booking_id:', pi.id)
    return
  }

  const supabase = createAdminClient()

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      'id, status, customer_id, monthly_price_aed, deposit_aed, total_add_ons_aed, duration_months'
    )
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    console.error('[stripe-webhook] booking not found:', bookingId)
    return
  }

  // Never trust metadata amounts: recompute from the database.
  const deposit = Number(booking.deposit_aed || 0)
  const monthly = Number(booking.monthly_price_aed || 0)
  const rent = monthly + Number(booking.total_add_ons_aed || 0)
  const expectedFils = Math.round((deposit + rent) * 100)
  const receivedFils = pi.amount_received || pi.amount

  if (receivedFils !== expectedFils) {
    console.error(
      `[stripe-webhook] amount mismatch for booking ${bookingId}: expected ${expectedFils}, got ${receivedFils} (pi ${pi.id})`
    )
    return
  }

  if (booking.status === 'cancelled') {
    console.error(
      `[stripe-webhook] payment received for cancelled booking ${bookingId} (pi ${pi.id}) - refund manually`
    )
    return
  }

  const paidAt = new Date().toISOString()

  if (deposit > 0) {
    await insertPayment(supabase, {
      booking_id: booking.id,
      customer_id: booking.customer_id,
      amount_aed: deposit,
      type: 'deposit',
      status: 'succeeded',
      provider: 'stripe',
      provider_payment_id: `${pi.id}:deposit`,
      paid_at: paidAt,
    })
  }

  if (rent > 0) {
    await insertPayment(supabase, {
      booking_id: booking.id,
      customer_id: booking.customer_id,
      amount_aed: rent,
      type: 'monthly_rental',
      status: 'succeeded',
      provider: 'stripe',
      provider_payment_id: `${pi.id}:rent`,
      paid_at: paidAt,
    })
  }

  if (Number(booking.duration_months ?? 1) > 1) {
    const nextDue = new Date()
    nextDue.setMonth(nextDue.getMonth() + 1)
    await insertPayment(supabase, {
      booking_id: booking.id,
      customer_id: booking.customer_id,
      amount_aed: monthly,
      type: 'monthly_rental',
      status: 'pending',
      provider: 'stripe',
      provider_payment_id: `${pi.id}:sched`,
      due_date: nextDue.toISOString().slice(0, 10),
    })
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'active', updated_at: paidAt })
    .eq('id', booking.id)
    .neq('status', 'cancelled')

  if (updateError) {
    throw new Error(`booking update failed: ${updateError.message}`)
  }

  await notifyCustomer(
    supabase,
    booking.customer_id,
    'Payment received',
    'Your payment was successful and your booking is now active.'
  )
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const bookingId = pi.metadata?.booking_id
  if (!bookingId) return

  const supabase = createAdminClient()
  const { data: booking } = await supabase
    .from('bookings')
    .select('customer_id')
    .eq('id', bookingId)
    .single()

  if (!booking) return

  await notifyCustomer(
    supabase,
    booking.customer_id,
    'Payment failed',
    'Your payment could not be completed. Please try again or use another card.'
  )
}