import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  MessageSquare,
  ChevronRight,
  Clock,
  AlertCircle,
  Phone,
} from 'lucide-react'
import NewTicketForm from './NewTicketForm'
import RoadsideButton from './RoadsideButton'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/support')

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, status, priority, created_at, updated_at')
    .eq('customer_id', user.id)
    .order('updated_at', { ascending: false })

  const statusStyles: Record<string, string> = {
    open: 'bg-blue-500/10 text-blue-500',
    in_progress: 'bg-yellow-500/10 text-yellow-500',
    resolved: 'bg-green-500/10 text-green-500',
    closed: 'bg-gray-500/10 text-gray-500',
  }

  const priorityStyles: Record<string, string> = {
    low: 'text-gray-500',
    normal: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    // Relative labels are computed once per server render (static output).
    // eslint-disable-next-line react-hooks/purity -- Date.now is intentional here
    const days = Math.floor((Date.now() - date.getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
            Help & Support
          </p>
          <h1 className="mt-2 text-3xl font-bold">Support Center</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Raise a ticket and our team will get back to you shortly.
          </p>
        </div>
        <NewTicketForm />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <a
          href="tel:+9718000000"
          className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]/50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
            <Phone className="h-5 w-5 text-green-500" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Call support — 800-0000</span>
            <span className="block text-xs text-[var(--muted-foreground)]">24/7 in-app call support</span>
          </span>
        </a>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <RoadsideButton />
        </div>
      </div>

      {!tickets || tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <h2 className="mt-4 text-lg font-semibold">No tickets yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Create a ticket if you need help with bookings, payments or documents.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/support/${ticket.id}`}
              className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]/50 sm:p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">{ticket.subject}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      statusStyles[ticket.status] ?? statusStyles.open
                    }`}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(ticket.updated_at)}
                  </span>
                  <span
                    className={`flex items-center gap-1 font-semibold capitalize ${
                      priorityStyles[ticket.priority] ?? ''
                    }`}
                  >
                    <AlertCircle className="h-3 w-3" />
                    {ticket.priority}
                  </span>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-foreground)]" />
            </Link>
          ))}
        </div>
      )}

      <section className="mt-10 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h2 className="font-semibold">Help center & FAQ</h2>
        <div className="mt-4 space-y-3 text-sm">
          <details className="rounded-xl bg-[var(--muted)] p-4">
            <summary className="cursor-pointer font-medium">How do monthly billing and deposits work?</summary>
            <p className="mt-2 text-[var(--muted-foreground)]">First payment = first month + refundable deposit + one-time add-ons. Later months bill automatically. Deposit returns after final inspection minus approved charges.</p>
          </details>
          <details className="rounded-xl bg-[var(--muted)] p-4">
            <summary className="cursor-pointer font-medium">How do I extend or end early?</summary>
            <p className="mt-2 text-[var(--muted-foreground)]">Open the booking and raise a support ticket with type extension/termination. Early termination may carry fees per the agreement.</p>
          </details>
          <details className="rounded-xl bg-[var(--muted)] p-4">
            <summary className="cursor-pointer font-medium">What if the car is damaged?</summary>
            <p className="mt-2 text-[var(--muted-foreground)]">File a damage report with photos immediately. We compare pickup/return condition reports.</p>
          </details>
          <details className="rounded-xl bg-[var(--muted)] p-4">
            <summary className="cursor-pointer font-medium">Roadside assistance?</summary>
            <p className="mt-2 text-[var(--muted-foreground)]">Raise an urgent ticket or call support. 24/7 number is shared after booking activation.</p>
          </details>
        </div>
      </section>
    </main>
  )
}