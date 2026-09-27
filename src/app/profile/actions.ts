'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile({
  fullName,
  phone,
  preferredLanguage,
}: {
  fullName: string
  phone: string
  preferredLanguage: 'en' | 'ar'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      preferred_language: preferredLanguage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { ok: true }
}