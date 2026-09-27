import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TicketChat from './TicketChat'

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/support')

  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('id, subject, status, priority, created_at')
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (ticketError || !ticket) {
    redirect('/support')
  }

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('id, message, sender_id, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  return (
    <TicketChat
      ticket={ticket}
      messages={messages ?? []}
      currentUserId={user.id}
    />
  )
}
