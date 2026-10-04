import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  MessageSquare,
  ChevronRight,
  Clock,
  AlertCircle,
  Phone,
  Sparkles,
  LifeBuoy,
  HelpCircle,
  Zap,
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
    open: 'border-sky-500/20 bg-sky-500/10 text-sky-600',
    in_progress: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    resolved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    closed: 'border-gray-500/20 bg-gray-500/10 text-gray-600',
  }

  const priorityStyles: Record<string, string> = {
    low: 'text-gray-500',
    normal: 'text-sky-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = Math.floor((Date.now() - date.getTime()) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Help & Support
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            We&rsquo;re here to help
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            Raise a ticket and our team will get back to you shortly. For urgent roadside issues, use the button below.
          </p>

          <div className="mt-8">
            <NewTicketForm />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {/* QUICK ACTIONS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <a
            href="tel:+9718003622277"
            className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-16 -top-16 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-100"
            />
            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Phone className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-600">
                  24/7 Phone
                </p>
                <p className="mt-1 font-serif text-xl tracking-tight">
                  Call 800-DMC-CARS
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  In-app call support
                </p>
              </div>
            </div>
          </a>

          <div className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-lg hover:shadow-[var(--accent)]/10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-16 -top-16 h-32 w-32 rounded-full bg-[var(--accent)]/10 blur-2xl"
            />
            <div className="relative">
              <RoadsideButton />
            </div>
          </div>
        </div>

        {/* TICKETS */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <LifeBuoy className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-2xl tracking-tight">
                  Your tickets
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {tickets?.length ?? 0} ticket{(tickets?.length ?? 0) === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>

          {!tickets || tickets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/20">
                <MessageSquare className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-serif text-xl tracking-tight">
                No tickets yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
                Create a ticket if you need help with bookings, payments, or documents. Our team will reply within hours.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                    <MessageSquare className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">
                        {ticket.subject}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          statusStyles[ticket.status] ?? statusStyles.open
                        }`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {formatTime(ticket.updated_at)}
                      </span>
                      <span
                        className={`flex items-center gap-1 font-semibold capitalize ${
                          priorityStyles[ticket.priority] ?? ''
                        }`}
                      >
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        {ticket.priority}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <HelpCircle className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl tracking-tight">
                Help center & FAQ
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Quick answers to common questions
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How do monthly billing and deposits work?',
                a: 'First payment = first month + refundable deposit + one-time add-ons. Later months bill automatically. Deposit returns after final inspection minus approved charges.',
              },
              {
                q: 'How do I extend or end early?',
                a: 'Open the booking and raise a support ticket with type extension or termination. Early termination may carry fees per the agreement.',
              },
              {
                q: 'What if the car is damaged?',
                a: 'File a damage report with photos immediately. We compare pickup and return condition reports before applying any charges.',
              },
              {
                q: 'Roadside assistance?',
                a: 'Raise an urgent ticket or call support. Our 24/7 number is shared after booking activation.',
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all hover:border-[var(--accent)]/40"
              >
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold transition hover:text-[var(--accent)] sm:px-6">
                  <span className="flex items-center gap-3">
                    <Zap className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                    {item.q}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:-rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <div className="border-t border-[var(--border)] px-5 py-4 text-sm leading-7 text-[var(--foreground)]/70 sm:px-6">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}