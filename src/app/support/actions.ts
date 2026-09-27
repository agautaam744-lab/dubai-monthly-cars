'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTicket({
  subject,
  message,
  priority,
}: {
  subject: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      customer_id: user.id,
      subject,
      priority,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !ticket) {
    return { ok: false, error: error?.message ?? 'Could not create ticket' }
  }

  await supabase.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    message,
  })

  revalidatePath('/support')
  return { ok: true, ticketId: ticket.id }
}

export async function sendMessage({
  ticketId,
  message,
}: {
  ticketId: string
  message: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    sender_id: user.id,
    message,
  })

  if (error) return { ok: false, error: error.message }

  await supabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  revalidatePath(`/support/${ticketId}`)
  revalidatePath('/support')
  return { ok: true }
}