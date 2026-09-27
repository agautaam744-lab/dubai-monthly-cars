'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const adminRoles = ['super_admin', 'finance']

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

  const { error } = await check.supabase
    .from('payments')
    .update({
      status: 'succeeded',
      paid_at: new Date().toISOString(),
      provider_payment_id: `retry_${Date.now()}`,
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