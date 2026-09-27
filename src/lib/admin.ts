import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'fleet_manager', 'finance', 'support', 'delivery']

  if (!profile || !adminRoles.includes(profile.role)) {
    redirect('/admin-login')
  }

  return {
    supabase,
    user,
    role: profile.role,
    fullName: profile.full_name,
  }
}