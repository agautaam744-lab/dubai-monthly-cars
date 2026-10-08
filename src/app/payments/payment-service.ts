'use server'

import { createClient } from '@/lib/supabase/server'
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

  if (booking.status === 'terminated') {
    return { ok: false, error: 'This booking has been terminated.' }
  }

  // Never trust client amount: recompute from DB to prevent undercharge.
  const totalAmount =
    Number(booking.deposit_aed || 0) +
    Number(booking.monthly_price_aed || 0) +
    Number(booking.total_add_ons_aed || 0)

  try {
    switch (data.provider) {
      case 'stripe':
      case 'apple_pay':
      case 'google_pay':
        return await createStripePaymentIntent({
          bookingId: data.bookingId,
          amountAed: totalAmount,
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
          amountAed: totalAmount,
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
    ...(data.paymentMethod === 'stripe' ? { payment_method_types: ['card'] } : {}),
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

export async function refundPayment(paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'You must be logged in.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'finance'].includes(profile.role)) {
    return { ok: false, error: 'Access denied.' }
  }

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (fetchError || !payment) {
    return { ok: false, error: 'Payment not found' }
  }

  try {
    if (payment.provider === 'stripe') {
      const stripe = await getStripeClient()
      await stripe.refunds.create({
        payment_intent: payment.provider_payment_id,
        amount: Math.round(Number(payment.amount_aed) * 100)
      })
    } else if (payment.provider === 'tabby') {
      const { secretKey, baseUrl } = await getTabbyClient()
      const res = await fetch(`${baseUrl}/api/v2/payments/${payment.provider_payment_id}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) {
        return { ok: false, error: 'Tabby refund failed' }
      }
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Refund failed' }
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'You must be logged in.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'finance'].includes(profile.role)) {
    return { ok: false, error: 'Access denied.' }
  }

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