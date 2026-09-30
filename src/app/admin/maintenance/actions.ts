'use server'

import { requireAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function scheduleMaintenance(
  _prevState: { ok?: boolean; error?: string },
  formData: FormData
) {
  const { supabase } = await requireAdmin()

  const vehicle_id = String(formData.get('vehicle_id') || '').trim()
  const type = String(formData.get('type') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const scheduled_date = String(formData.get('scheduled_date') || '')
  const mileage_at_service = formData.get('mileage_at_service')
    ? Number(formData.get('mileage_at_service'))
    : null
  const cost_aed = formData.get('cost_aed') ? Number(formData.get('cost_aed')) : 0

  if (!vehicle_id || !type || !scheduled_date) {
    return { ok: false, error: 'Vehicle, type and scheduled date are required.' }
  }

  const { error } = await supabase.from('maintenance_records').insert({
    vehicle_id,
    type,
    description: description || null,
    scheduled_date,
    mileage_at_service,
    cost_aed,
    status: 'scheduled',
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/maintenance')
  return { ok: true }
}

export async function completeMaintenance(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('maintenance_records')
    .update({ status: 'completed', completed_date: new Date().toISOString().slice(0, 10) })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/maintenance')
  return { ok: true }
}
