'use server'

import { requireAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function createPromoCode(
  _prevState: { ok?: boolean; error?: string },
  formData: FormData
) {
  const { supabase } = await requireAdmin()

  const code = String(formData.get('code') || '').trim().toUpperCase()
  const discount_percent = Number(formData.get('discount_percent') || 0)
  const max_uses = formData.get('max_uses') ? Number(formData.get('max_uses')) : null
  const expires_at = String(formData.get('expires_at') || '') || null

  if (!code || discount_percent <= 0 || discount_percent > 90) {
    return { ok: false, error: 'Code and a discount of 1–90% are required.' }
  }

  const { error } = await supabase.from('promo_codes').insert({
    code,
    discount_percent,
    max_uses,
    expires_at,
    is_active: true,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/finance')
  return { ok: true }
}

export async function togglePromoCode(id: string, isActive: boolean) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('promo_codes').update({ is_active: isActive }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/finance')
  return { ok: true }
}
