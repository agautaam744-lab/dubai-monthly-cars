'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: boolean; error?: string }

export async function updateReferralSettings({
  isActive,
  rewardAmount,
  referrerBonus,
  minBookingAmount,
  maxReferrals,
}: {
  isActive: boolean
  rewardAmount: number
  referrerBonus: number
  minBookingAmount: number
  maxReferrals: number | null
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'finance']
  if (!profile || !adminRoles.includes(profile.role)) {
    return { ok: false, error: 'Access denied' }
  }

  if (rewardAmount < 0 || referrerBonus < 0 || minBookingAmount < 0) {
    return { ok: false, error: 'Amounts must be positive' }
  }

  const { data: existing } = await supabase
    .from('referral_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (!existing) {
    const { error } = await supabase.from('referral_settings').insert({
      is_active: isActive,
      reward_amount_aed: rewardAmount,
      referrer_bonus_aed: referrerBonus,
      min_booking_amount_aed: minBookingAmount,
      max_referrals_per_user: maxReferrals,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('referral_settings')
      .update({
        is_active: isActive,
        reward_amount_aed: rewardAmount,
        referrer_bonus_aed: referrerBonus,
        min_booking_amount_aed: minBookingAmount,
        max_referrals_per_user: maxReferrals,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath('/admin/marketing')
  revalidatePath('/referral')

  return { ok: true }
}