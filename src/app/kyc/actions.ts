'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setBlacklist(
  userId: string,
  blacklisted: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { ok: false, error: 'Not logged in' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { ok: false, error: 'Failed to fetch user profile' }
  }

  // Blacklist sirf super_admin kar sake — sensitive action hai
  if (profile.role !== 'super_admin') {
    return { ok: false, error: 'Only super admin can blacklist customers' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_blacklisted: blacklisted })
    .eq('id', userId)

  if (updateError) {
    return { ok: false, error: `Failed to update blacklist status: ${updateError.message}` }
  }

  // Activity log (doc 2.7) — error aaye to ignore
  try {
    await supabase.from('activity_logs').insert({
      actor_id: user.id,
      action: blacklisted ? 'customer_blacklisted' : 'customer_unblacklisted',
      entity_type: 'profile',
      entity_id: userId,
    })
  } catch (logError) {
    console.error('Failed to log activity:', logError)
    // Continue anyway — blacklist update successful
  }

  revalidatePath('/admin/kyc')
  return { ok: true }
}