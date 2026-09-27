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
    .limit(3)

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
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (status === 'rejected')
      return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-AE', {
        year: 'numeric',
        month: 'long',
      })
    : '—'

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          My Account
        </p>
        <h1 className="mt-2 text-3xl font-bold">Profile Settings</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Manage your personal details, documents and payment history.
        </p>
      </div>

      {/* Personal Info Card */}
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <User className="h-7 w-7 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {profile?.full_name ?? 'Complete your profile'}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Member since {memberSince}
            </p>
          </div>
        </div>

        <ProfileForm
          profile={{
            full_name: profile?.full_name ?? null,
            phone: profile?.phone ?? null,
            email: user.email ?? null,
            preferred_language: profile?.preferred_language ?? 'en',
          }}
        />
      </section>

      {/* KYC Documents Status */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">KYC Documents</h2>
          </div>
          <Link
            href="/kyc"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] transition hover:underline"
          >
            Manage
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {!documents || documents.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">
            No documents uploaded yet.
            <Link
              href="/kyc"
              className="ml-2 font-semibold text-[var(--accent)] hover:underline"
            >
              Upload now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 sm:p-5"
              >
                <div className="flex items-center gap-3">
                  {docStatusIcon(doc.status)}
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {doc.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Uploaded {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    doc.status === 'approved'
                      ? 'bg-green-500/10 text-green-500'
                      : doc.status === 'rejected'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Payments */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Recent Payments</h2>
          </div>
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] transition hover:underline"
          >
            View All
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {!payments || payments.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">
            No payments recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                    <CreditCard className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {p.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(p.paid_at)}
                      {p.provider ? ` · ${p.provider}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold">
                  {formatAED(Number(p.amount_aed))}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/bookings"
          className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]/50"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            <span className="font-semibold">My Bookings</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
        </Link>
        <Link
          href="/watchlist"
          className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]/50"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            <span className="font-semibold">My Watchlist</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
        </Link>
      </section>
    </main>
  )
}