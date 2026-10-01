'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveDocument(documentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'support', 'fleet_manager']
  if (!profile || !adminRoles.includes(profile.role)) {
    return { ok: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('documents')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', documentId)

  if (error) return { ok: false, error: error.message }

  const { data: doc } = await supabase
    .from('documents')
    .select('user_id, type')
    .eq('id', documentId)
    .single()

  if (doc) {
    await supabase.from('notifications').insert({
      user_id: doc.user_id,
      title: 'KYC Document Approved',
      body: `Your ${doc.type.replace('_', ' ')} has been verified successfully.`,
      type: 'kyc',
      link: '/kyc',
    })
  }

  revalidatePath('/admin/kyc')
  revalidatePath('/kyc')
  return { ok: true }
}

export async function rejectDocument(documentId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'support', 'fleet_manager']
  if (!profile || !adminRoles.includes(profile.role)) {
    return { ok: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('documents')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim() || 'Document not acceptable',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', documentId)

  if (error) return { ok: false, error: error.message }

  const { data: doc } = await supabase
    .from('documents')
    .select('user_id, type')
    .eq('id', documentId)
    .single()

  if (doc) {
    await supabase.from('notifications').insert({
      user_id: doc.user_id,
      title: 'KYC Document Rejected',
      body: `Your ${doc.type.replace('_', ' ')} was rejected. Reason: ${reason}`,
      type: 'kyc',
      link: '/kyc',
    })
  }

  revalidatePath('/admin/kyc')
  revalidatePath('/kyc')
  return { ok: true }
}

export async function toggleBlacklist(userId: string, blacklist: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'support', 'fleet_manager']
  if (!profile || !adminRoles.includes(profile.role)) {
    return { ok: false, error: 'Access denied' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_blacklisted: blacklist })
    .eq('id', userId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/kyc')
  return { ok: true }
}
