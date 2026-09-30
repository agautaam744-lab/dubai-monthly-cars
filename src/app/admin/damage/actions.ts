'use server'

import { requireAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function resolveDamageReport(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('damage_reports')
    .update({ status: 'resolved' })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/damage')
  return { ok: true }
}

export async function chargeAgainstDeposit(id: string, amount: number) {
  const { supabase } = await requireAdmin()

  const { data: report, error: fetchError } = await supabase
    .from('damage_reports')
    .select('id, booking_id, estimated_cost_aed')
    .eq('id', id)
    .single()

  if (fetchError || !report) return { ok: false, error: 'Report not found' }

  const charge = amount > 0 ? amount : Number(report.estimated_cost_aed || 0)
  if (charge <= 0) return { ok: false, error: 'Enter an amount greater than zero.' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, customer_id')
    .eq('id', report.booking_id)
    .single()

  if (!booking) return { ok: false, error: 'Linked booking not found' }

  const { error: payError } = await supabase.from('payments').insert({
    booking_id: booking.id,
    customer_id: booking.customer_id,
    amount_aed: charge,
    type: 'damage_charge',
    status: 'succeeded',
    provider: 'deposit',
    provider_payment_id: `deposit_${Date.now()}`,
    paid_at: new Date().toISOString(),
  })

  if (payError) return { ok: false, error: payError.message }

  const { error } = await supabase
    .from('damage_reports')
    .update({ status: 'charged', charged_against_deposit: true })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  await supabase.from('notifications').insert({
    user_id: booking.customer_id,
    title: `AED ${charge.toLocaleString()} charged for damage repair`,
    body: 'Repair cost was charged against your security deposit. See damage reports for details.',
    type: 'payment',
    link: `/bookings/${booking.id}`,
  })

  revalidatePath('/admin/damage')
  return { ok: true }
}
