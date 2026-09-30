'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const adminRoles = ['super_admin', 'fleet_manager', 'finance', 'support', 'delivery']

export async function adminLogin(
  _prevState: { error: string | null },
  formData: FormData
) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: 'Invalid email or password' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { error: 'Profile not found. Please contact support.' }
  }

  if (!adminRoles.includes(profile.role)) {
    await supabase.auth.signOut()
    return { error: 'This account does not have admin access.' }
  }

  redirect('/admin')
}

export async function adminLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin-login')
}
