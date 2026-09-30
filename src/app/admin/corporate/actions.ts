'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'

export async function createCorporateAccount(
  _prevState: { ok?: boolean; error?: string },
  formData: FormData
) {
  const { supabase } = await requireAdmin()

  const company_name = String(formData.get('company_name') || '').trim()
  const contact_person = String(formData.get('contact_person') || '').trim()
  const contact_phone = String(formData.get('contact_phone') || '').trim()
  const trade_license = String(formData.get('trade_license') || '').trim()
  const retainer_amount = Number(formData.get('retainer_amount') || 0)
  const guaranteed_vehicles = Number(formData.get('guaranteed_vehicles') || 0)

  if (!company_name || !contact_person) {
    return { ok: false, error: 'Company name and contact person are required.' }
  }

  const { error } = await supabase.from('corporate_accounts').insert({
    company_name,
    contact_person,
    contact_phone: contact_phone || null,
    trade_license: trade_license || null,
    retainer_amount,
    guaranteed_vehicles,
    status: 'active',
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/corporate')
  return { ok: true }
}

export async function toggleCorporateStatus(id: string, status: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('corporate_accounts')
    .update({ status })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/corporate')
  return { ok: true }
}
