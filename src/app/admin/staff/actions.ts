'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isStaffRole, isSuperAdmin } from '@/lib/rbac'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function verifySuperAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      supabase: null,
      userId: null,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isSuperAdmin(profile?.role)) {
    return {
      ok: false,
      supabase: null,
      userId: null,
    }
  }

  return {
    ok: true,
    supabase,
    userId: user.id,
  }
}

// ===== CREATE NEW STAFF =====

export async function createStaffMember(formData: FormData) {
  const check = await verifySuperAdmin()

  if (!check.ok || !check.supabase) {
    return {
      ok: false,
      error: 'Only Super Admin can add staff',
    }
  }

  const fullName = String(formData.get('fullName') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const role = String(formData.get('role') || '')

  if (!fullName || !email || !password || !role) {
    return {
      ok: false,
      error: 'All fields are required',
    }
  }

  if (!isStaffRole(role)) {
    return {
      ok: false,
      error: 'Invalid role selected',
    }
  }

  if (password.length < 8) {
    return {
      ok: false,
      error: 'Password must be at least 8 characters',
    }
  }

  if (!SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error: 'Server misconfigured: missing SERVICE_ROLE_KEY',
    }
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      return {
        ok: false,
        error: 'This email is already registered',
      }
    }

    return {
      ok: false,
      error: authError.message,
    }
  }

  if (!authData.user) {
    return {
      ok: false,
      error: 'Failed to create auth user',
    }
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: authData.user.id,
      full_name: fullName,
      email,
      role,
      updated_at: new Date().toISOString(),
    })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)

    return {
      ok: false,
      error: profileError.message,
    }
  }

  revalidatePath('/admin/staff')

  return {
    ok: true,
    message: `${fullName} added as ${role.replace('_', ' ')}`,
  }
}

// ===== PROMOTE CUSTOMER TO STAFF =====

export async function promoteToStaff(formData: FormData) {
  const userId = String(formData.get('userId') || '')
  const newRole = String(formData.get('role') || '')

  if (!userId || !isStaffRole(newRole)) {
    return
  }

  const check = await verifySuperAdmin()

  if (!check.ok || !check.supabase) {
    return
  }

  await check.supabase
    .from('profiles')
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  revalidatePath('/admin/staff')
}

// ===== DEMOTE STAFF TO CUSTOMER =====

export async function demoteToCustomer(formData: FormData) {
  const userId = String(formData.get('userId') || '')

  if (!userId) {
    return
  }

  const check = await verifySuperAdmin()

  if (!check.ok || !check.supabase) {
    return
  }

  if (userId === check.userId) {
    return
  }

  await check.supabase
    .from('profiles')
    .update({
      role: 'customer',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  revalidatePath('/admin/staff')
}
