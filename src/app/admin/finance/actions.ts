'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const adminRoles = ['super_admin', 'admin', 'finance']

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

export async function retryFailedPayment(paymentId: string) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) {
    return { ok: false, error: 'Access denied' }
  }

  // Reset to pending so the billing cron can pick it up (do NOT mark succeeded).
  const { error } = await check.supabase
    .from('payments')
    .update({
      status: 'pending',
      retry_count: 0,
      failure_reason: null,
    })
    .eq('id', paymentId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function refundPayment(paymentId: string) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) {
    return { ok: false, error: 'Access denied' }
  }

  const { data: paymentToRefund } = await check.supabase
    .from('payments')
    .select('id, provider, provider_payment_id, amount_aed, status')
    .eq('id', paymentId)
    .single()

  if (!paymentToRefund) {
    return { ok: false, error: 'Payment not found' }
  }

  // Attempt real provider refund first; only mark refunded on success.
  try {
    if (paymentToRefund.provider === 'stripe' && paymentToRefund.provider_payment_id) {
      const secretKey = process.env.STRIPE_SECRET_KEY
      if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured')
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(secretKey)
      await stripe.refunds.create({
        payment_intent: paymentToRefund.provider_payment_id,
        amount: Math.round(Number(paymentToRefund.amount_aed) * 100),
      })
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Provider refund failed' }
  }

  const { error } = await check.supabase
    .from('payments')
    .update({ status: 'refunded' })
    .eq('id', paymentId)

  if (error) return { ok: false, error: error.message }

  const { data: payment } = await check.supabase
    .from('payments')
    .select('customer_id, amount_aed')
    .eq('id', paymentId)
    .single()

  if (payment) {
    await check.supabase.from('notifications').insert({
      user_id: payment.customer_id,
      title: 'Refund Processed',
      body: `Your refund of AED ${Number(payment.amount_aed).toLocaleString()} has been processed.`,
      type: 'payment',
      link: '/bookings',
    })
  }

  revalidatePath('/admin/finance')
  return { ok: true }
}