'use server'

import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

type PaymentResult = 
  | { ok: true; sessionId?: string; url?: string; clientSecret?: string }
  | { ok: false; error: string }

type PaymentProvider = 'stripe' | 'tabby' | 'apple_pay' | 'google_pay'

interface PaymentIntentData {
  bookingId: string
  amountAed: number
  currency: 'AED'
  provider: PaymentProvider
  returnUrl: string
  customerEmail: string
  customerName: string
  metadata?: Record<string, string>
}

async function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured')
  const Stripe = (await import('stripe')).default
  return new Stripe(secretKey, { apiVersion: '2026-08-26.dahlia' })
}

async function getTabbyClient() {
  const secretKey = process.env.TABBY_SECRET_KEY
  if (!secretKey) throw new Error('TABBY_SECRET_KEY not configured')
  return {
    secretKey,
    baseUrl: process.env.TABBY_API_URL || 'https://api.tabby.ai'
  }
}

export async function createPaymentIntent(data: PaymentIntentData): Promise<PaymentResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { ok: false, error: 'You must be logged in to pay.' }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, customer_id, monthly_price_aed, deposit_aed, total_add_ons_aed, duration_months, start_date')
    .eq('id', data.bookingId)
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

  const depositAmount = Number(data.amountAed) || 0

  try {
    switch (data.provider) {
      case 'stripe':
      case 'apple_pay':
      case 'google_pay':
        return await createStripePaymentIntent({
          bookingId: data.bookingId,
          amountAed: data.amountAed,
          currency: data.currency,
          paymentMethod: data.provider,
          returnUrl: data.returnUrl,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          metadata: data.metadata
        })

      case 'tabby':
        return await createTabbySession({
          bookingId: data.bookingId,
          amountAed: data.amountAed,
          currency: data.currency,
          returnUrl: data.returnUrl,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          metadata: data.metadata
        })

      default:
        return { ok: false, error: `Unsupported payment provider: ${data.provider}` }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Payment initiation failed' }
  }
}

async function createStripePaymentIntent(data: {
  bookingId: string
  amountAed: number
  currency: 'AED'
  paymentMethod: 'stripe' | 'apple_pay' | 'google_pay'
  returnUrl: string
  customerEmail: string
  customerName: string
  metadata?: Record<string, string>
}): Promise<PaymentResult> {
  const stripe = await getStripeClient()

  const amountInFils = Math.round(data.amountAed * 100) // Convert AED to fils (100 fils = 1 AED)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInFils,
    currency: 'aed',
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never'
    },
    payment_method_types: ['card'],
    receipt_email: data.customerEmail,
    metadata: {
      booking_id: data.bookingId,
      ...data.metadata
    },
    shipping: {
      name: data.customerName,
      address: {
        country: 'AE'
      }
    }
  })

  return {
    ok: true,
    clientSecret: paymentIntent.client_secret ?? undefined,
    sessionId: paymentIntent.id
  }
}

async function createTabbySession(data: {
  bookingId: string
  amountAed: number
  currency: 'AED'
  returnUrl: string
  customerEmail: string
  customerName: string
  metadata?: Record<string, string>
}): Promise<PaymentResult> {
  const { secretKey, baseUrl } = await getTabbyClient()

  const response = await fetch(`${baseUrl}/api/v2/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: data.amountAed,
      currency: 'AED',
      buyer: {
        email: data.customerEmail,
        name: data.customerName
      },
      order: {
        reference_id: data.bookingId,
        items: [{
          title: 'Monthly Car Rental',
          unit_price: data.amountAed,
          quantity: 1
        }]
      },
      buyer_history: {
        registered_since: new Date().toISOString(),
        loyalty_level: 0
      },
      success_url: `${data.returnUrl}?payment=success&provider=tabby`,
      cancel_url: `${data.returnUrl}?payment=cancelled&provider=tabby`,
      failure_url: `${data.returnUrl}?payment=failed&provider=tabby`
    })
  })

  if (!response.ok) {
    const error = await response.json()
    return { ok: false, error: error.message || 'Tabby session creation failed' }
  }

  const tabbyResponse = await response.json()
  const url = tabbyResponse.configuration?.available_payment_methods?.[0]?.url || tabbyResponse.redirect_url
  return {
    ok: true,
    url,
    sessionId: tabbyResponse.id
  }
}

export async function handlePaymentWebhook(
  provider: 'stripe' | 'tabby',
  request: Request
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    if (provider === 'stripe') {
      return await handleStripeWebhook(await createClient(), request)
    } else if (provider === 'tabby') {
      return await handleTabbyWebhook(await createClient(), request)
    }
    return { ok: false, error: 'Unknown provider' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Webhook processing failed' }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleStripeWebhook(supabase: any, request: Request): Promise<{ ok: boolean; error?: string }> {
  const stripe = await getStripeClient()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !signature) {
    return { ok: false, error: 'STRIPE_WEBHOOK_SECRET or signature not configured' }
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return { ok: false, error: 'Webhook signature verification failed' }
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    const bookingId = paymentIntent.metadata?.booking_id

    if (bookingId) {
      const amount = paymentIntent.amount / 100 // Convert from fils to AED
      
      await supabase.from('payments').insert({
        booking_id: bookingId,
        amount_aed: amount,
        type: 'monthly_rental',
        status: 'succeeded',
        provider: 'stripe',
        provider_payment_id: paymentIntent.id,
        paid_at: new Date().toISOString()
      })

      await supabase
        .from('bookings')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', bookingId)

      // Schedule next month payment for multi-month bookings
      const { data: booking } = await supabase
        .from('bookings')
        .select('duration_months')
        .eq('id', bookingId)
        .single()

      if (booking && (booking.duration_months || 1) > 1) {
        const nextDue = new Date()
        nextDue.setMonth(nextDue.getMonth() + 1)
        await supabase.from('payments').insert({
          booking_id: bookingId,
          amount_aed: Number(paymentIntent.metadata?.monthly_amount || 0),
          type: 'monthly_rental',
          status: 'pending',
          provider: 'stripe',
          provider_payment_id: `stripe_sched_${Date.now()}`,
          due_date: nextDue.toISOString().slice(0, 10)
        })
      }
    }
  }

  return { ok: true }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTabbyWebhook(supabase: any, request: Request): Promise<{ ok: boolean; error?: string }> {
  const body = await request.json()
  
  if (body.event === 'payment.captured') {
    const payment = body.payment
    const bookingId = payment.order?.reference_id

    if (bookingId) {
      await supabase.from('payments').insert({
        booking_id: bookingId,
        amount_aed: payment.amount,
        type: 'monthly_rental',
        status: 'succeeded',
        provider: 'tabby',
        provider_payment_id: payment.id,
        paid_at: new Date().toISOString()
      })

      await supabase
        .from('bookings')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
    }
  }

  return { ok: true }
}

export async function refundPayment(paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (fetchError || !payment) {
    return { ok: false, error: 'Payment not found' }
  }

  if (payment.provider === 'stripe') {
    const stripe = await getStripeClient()
    await stripe.refunds.create({
      payment_intent: payment.provider_payment_id,
      amount: Math.round(Number(payment.amount_aed) * 100)
    })
  } else if (payment.provider === 'tabby') {
    const { secretKey, baseUrl } = await getTabbyClient()
    await fetch(`${baseUrl}/api/v2/payments/${payment.provider_payment_id}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    })
  }

  await supabase
    .from('payments')
    .update({ status: 'refunded' })
    .eq('id', paymentId)

  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function retryFailedPayment(paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (!payment) {
    return { ok: false, error: 'Payment not found' }
  }

  // Reset to pending so cron can pick it up
  await supabase
    .from('payments')
    .update({ 
      status: 'pending',
      provider_payment_id: `retry_${Date.now()}`
    })
    .eq('id', paymentId)

  revalidatePath('/admin/finance')
  return { ok: true }
}