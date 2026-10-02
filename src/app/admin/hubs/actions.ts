'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: boolean; error?: string; id?: string }

export async function createHub(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'fleet_manager'].includes(profile.role)) {
    return { ok: false, error: 'Access denied' }
  }

  const name = String(formData.get('name') ?? '').trim()
  const address = String(formData.get('address') ?? '').trim()
  const area = String(formData.get('area') ?? '').trim() || null
  const phone = String(formData.get('phone') ?? '').trim() || null
  const openingHours = String(formData.get('opening_hours') ?? '').trim() || '9:00 AM - 9:00 PM'
  const notes = String(formData.get('notes') ?? '').trim() || null
  const isPrimary = formData.get('is_primary') === 'on'

  if (!name || !address) {
    return { ok: false, error: 'Name and address are required' }
  }

  const { data, error } = await supabase
    .from('hubs')
    .insert({
      name,
      address,
      area,
      phone,
      opening_hours: openingHours,
      notes,
      is_primary: isPrimary,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/hubs')
  return { ok: true, id: data.id }
}

export async function toggleHubActive(hubId: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'fleet_manager'].includes(profile.role)) {
    return { ok: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('hubs')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', hubId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/hubs')
  return { ok: true }
}

export async function deleteHub(hubId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin'].includes(profile.role)) {
    return { ok: false, error: 'Only super admin can delete hubs' }
  }

  const { error } = await supabase.from('hubs').delete().eq('id', hubId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/hubs')
  return { ok: true }
}