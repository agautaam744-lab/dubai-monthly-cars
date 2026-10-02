import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  User,
  FileText,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Wallet,
  CalendarCheck,
  Heart,
  ArrowRight,
} from 'lucide-react'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, email, preferred_language, created_at')
    .eq('id', user.id)
    .single()

  const { data: documents } = await supabase
    .from('documents')
    .select('id, type, status, expires_at, reviewed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: payments } = await supabase
    .from('payments')
    .select('id, provider, amount_aed, type, status, paid_at')
    .eq('customer_id', user.id)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .limit(10)

  const methods = Array.from(
    new Map(
      (payments ?? [])
        .filter((p) => p.provider)
        .map((p) => [String(p.provider), p] as const)
    ).values()
  )

  const walletBalance = (payments ?? [])
    .filter((p) => ['wallet_credit', 'refund', 'referral_payout'].includes(String(p.type)))
    .reduce((sum, p) => sum + Number(p.amount_aed || 0), 0)

  const formatAED = (v: number) =>
    new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(v)

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const docStatusIcon = (status: string) => {
    if (status === 'approved')
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    if (status === 'rejected')
      return <XCircle className="h-5 w-5 text-red-500" />
    return <AlertCircle className="h-5 w-5 text-amber-500" />
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-AE', {
        year: 'numeric',
        month: 'long',
      })
    : '—'

  const initials = (profile?.full_name ?? user.email ?? 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

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
            My Account
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            Profile Settings
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            Manage your personal details, documents, and payment history.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {/* PERSONAL INFO CARD */}
        <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="relative bg-gradient-to-br from-[var(--primary)] via-black to-[var(--primary)] p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_20%,rgba(201,162,39,0.25),transparent_60%)]"
            />
            <div className="relative flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-bold text-white backdrop-blur-md">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="font-serif text-2xl tracking-tight text-white sm:text-3xl">
                  {profile?.full_name ?? 'Complete your profile'}
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Member since {memberSince}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <ProfileForm
              profile={{
                full_name: profile?.full_name ?? null,
                phone: profile?.phone ?? null,
                email: user.email ?? null,
                preferred_language: profile?.preferred_language ?? 'en',
              }}
            />
          </div>
        </section>

        {/* KYC DOCUMENTS */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <FileText className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-lg tracking-tight">KYC Documents</h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {documents?.length ?? 0} document{(documents?.length ?? 0) === 1 ? '' : 's'} uploaded
                </p>
              </div>
            </div>
            <Link
              href="/kyc"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] transition hover:opacity-80"
            >
              Manage
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          {!documents || documents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                No documents uploaded yet.
              </p>
              <Link
                href="/kyc"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Upload now
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-5 transition hover:bg-[var(--muted)]/30"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {docStatusIcon(doc.status)}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold capitalize">
                        {doc.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Uploaded {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                      doc.status === 'approved'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                        : doc.status === 'rejected'
                          ? 'border-red-500/20 bg-red-500/10 text-red-600'
                          : 'border-amber-500/20 bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* WALLET + PAYMENT METHODS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-transparent p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-16 -top-16 h-32 w-32 rounded-full bg-[var(--accent)]/15 blur-2xl"
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <Wallet className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                Wallet Balance
              </p>
            </div>
            <p className="relative mt-4 font-serif text-4xl tracking-tight tabular-nums text-[var(--accent)]">
              {formatAED(walletBalance)}
            </p>
            <p className="relative mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
              Refunds, referral payouts, and promo credits land here.
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <CreditCard className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-lg tracking-tight">Payment Methods</h2>
            </div>
            {methods.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                No saved methods yet. One is recorded automatically after your first payment.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {methods.map((m) => (
                  <li
                    key={String(m.provider)}
                    className="flex items-center justify-between rounded-xl bg-[var(--muted)]/50 px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium capitalize">
                      {String(m.provider).replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(m.paid_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* RECENT PAYMENTS */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <CreditCard className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-lg tracking-tight">Recent Payments</h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Last {payments?.length ?? 0} successful transaction{(payments?.length ?? 0) === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <Link
              href="/bookings"
              className="group inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] transition hover:opacity-80"
            >
              View all
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          {!payments || payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
              No payments recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-5 transition hover:bg-[var(--muted)]/30"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                      <CreditCard className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold capitalize">
                        {p.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatDate(p.paid_at)}
                        {p.provider ? ` · ${p.provider}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-serif text-lg tabular-nums tracking-tight">
                    {formatAED(Number(p.amount_aed))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* QUICK LINKS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/bookings"
            className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-lg hover:shadow-[var(--accent)]/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <CalendarCheck className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <span className="font-serif text-base tracking-tight">My Bookings</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
          </Link>

          <Link
            href="/watchlist"
            className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-lg hover:shadow-[var(--accent)]/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <Heart className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <span className="font-serif text-base tracking-tight">Watchlist</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
          </Link>

          <Link
            href="/support"
            className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-lg hover:shadow-[var(--accent)]/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <span className="font-serif text-base tracking-tight">Support</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  )
}