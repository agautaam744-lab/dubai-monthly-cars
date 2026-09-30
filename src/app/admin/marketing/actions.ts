'use server'

import { requireAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export async function sendBroadcast(
  _prevState: { ok?: boolean; error?: string; count?: number },
  formData: FormData
) {
  const { supabase } = await requireAdmin()

  const title = String(formData.get('title') || '').trim()
  const body = String(formData.get('body') || '').trim()
  const type = String(formData.get('type') || 'promo')

  if (!title || !body) {
    return { ok: false, error: 'Title and message are required.' }
  }

  const { data: customers, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'customer')

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!customers || customers.length === 0) {
    return { ok: false, error: 'No customers to notify.' }
  }

  const rows = customers.map((c) => ({
    user_id: c.id,
    title,
    body,
    type,
    link: '/notifications',
  }))

  // Insert in chunks to stay within payload limits.
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await supabase.from('notifications').insert(rows.slice(i, i + 100))
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath('/admin/marketing')
  return { ok: true, count: rows.length }
}
