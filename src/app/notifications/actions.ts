'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  revalidatePath('/notifications')
  return { ok: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  revalidatePath('/notifications')
  return { ok: true }
}

// Helper to create notification (use in other server actions)
export async function createNotification({
  userId,
  title,
  body,
  type,
  link,
}: {
  userId: string
  title: string
  body?: string
  type?: string
  link?: string
}) {
  const supabase = await createClient()
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body,
    type,
    link,
  })
}