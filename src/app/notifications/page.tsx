import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationList from './NotificationList'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/notifications')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, body, type, is_read, link, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Updates & Alerts
        </p>
        <h1 className="mt-2 text-3xl font-bold">Notifications</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Booking confirmations, payment reminders and document alerts.
        </p>
      </div>

      <NotificationList notifications={notifications ?? []} />
    </main>
  )
}