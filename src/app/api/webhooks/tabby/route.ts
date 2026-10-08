import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secretKey = process.env.TABBY_SECRET_KEY
  const webhookSecret = process.env.TABBY_WEBHOOK_SECRET

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Tabby webhook not configured' }, { status: 400 })
  }

  // Verify signature
  const signature = request.headers.get('x-tabby-signature') || request.headers.get('tabby-signature')
  const body = await request.text()

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Tabby uses HMAC-SHA256 with the webhook secret
  const crypto = await import('crypto')
  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')

  if (signature !== expectedSignature) {
    console.error('[tabby-webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    await processTabbyEvent(event)
  } catch (err) {
    console.error('[tabby-webhook] Processing failed:', err)
    // 500 makes Tabby retry later; handler is idempotent so retries are safe
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function processTabbyEvent(event: any) {
  // Tabby events: payment.captured, payment.refunded, payment.authorized, payment.expired
  if (event.event !== 'payment.captured') {
    console.log('[tabby-webhook] Ignoring event:', event.event)
    return
  }

  const payment = event.payment
  const bookingId = payment.order?.reference_id

  if (!bookingId) {
    console.warn('[tabby-webhook] payment.captured without booking reference_id:', payment.id)
    return
  }

  const supabase = createAdminClient()

  // Get booking to verify amount
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, customer_id, monthly_price_aed, deposit_aed, total_add_ons_aed, duration_months')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    console.error('[tabby-webhook] Booking not found:', bookingId)
    return
  }

  if (booking.status === 'cancelled' || booking.status === 'terminated') {
    console.error('[tabby-webhook] Payment received for', booking.status, 'booking', bookingId, '- refund manually')
    return
  }

  // Verify amount matches (Tabby sends amount in AED)
  const deposit = Number(booking.deposit_aed || 0)
  const monthly = Number(booking.monthly_price_aed || 0)
  const addOns = Number(booking.total_add_ons_aed || 0)
  const expectedAmount = deposit + monthly + addOns
  const receivedAmount = Number(payment.amount)

  if (receivedAmount !== expectedAmount) {
    console.error(
      `[tabby-webhook] Amount mismatch for booking ${bookingId}: expected ${expectedAmount}, got ${receivedAmount} (payment ${payment.id})`
    )
    return
  }

  const paidAt = new Date().toISOString()

  // Insert payment records (idempotent via unique provider_payment_id)
  const { error: depositError } = await supabase.from('payments').insert({
    booking_id: booking.id,
    customer_id: booking.customer_id,
    amount_aed: deposit,
    type: 'deposit',
    status: 'succeeded',
    provider: 'tabby',
    provider_payment_id: `${payment.id}:deposit`,
    paid_at: paidAt,
  }).select()

  if (depositError && depositError.code !== '23505') {
    throw new Error(`deposit payment insert failed: ${depositError.message}`)
  }

  const rent = monthly + addOns
  const { error: rentError } = await supabase.from('payments').insert({
    booking_id: booking.id,
    customer_id: booking.customer_id,
    amount_aed: rent,
    type: 'monthly_rental',
    status: 'succeeded',
    provider: 'tabby',
    provider_payment_id: `${payment.id}:rent`,
    paid_at: paidAt,
  })

  if (rentError && rentError.code !== '23505') {
    throw new Error(`rent payment insert failed: ${rentError.message}`)
  }

  // Schedule next month payment for multi-month bookings
  if (Number(booking.duration_months ?? 1) > 1) {
    const nextDue = new Date()
    nextDue.setMonth(nextDue.getMonth() + 1)
    await supabase.from('payments').insert({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      amount_aed: monthly,
      type: 'monthly_rental',
      status: 'pending',
      provider: 'tabby',
      provider_payment_id: `${payment.id}:sched`,
      due_date: nextDue.toISOString().slice(0, 10),
    })
  }

  // Activate booking
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'active', updated_at: paidAt })
    .eq('id', booking.id)
    .not('status', 'in', '(cancelled,terminated)')

  if (updateError) {
    throw new Error(`booking update failed: ${updateError.message}`)
  }

  // Notify customer
  await supabase.from('notifications').insert({
    user_id: booking.customer_id,
    title: 'Payment received',
    body: 'Your payment was successful and your booking is now active.',
    type: 'payment',
    link: '/bookings',
  })
}