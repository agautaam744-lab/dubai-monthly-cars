'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { ok: boolean; error?: string }

export async function assignVehicleToHub(
  vehicleId: string,
  hubId: string | null
): Promise<ActionResult> {
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
    .from('vehicles')
    .update({ hub_id: hubId, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/fleet')
  revalidatePath(`/admin/fleet/${vehicleId}`)
  revalidatePath('/admin/hubs')

  return { ok: true }
}