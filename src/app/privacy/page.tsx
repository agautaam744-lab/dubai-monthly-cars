import Link from 'next/link'
import { ChevronLeft, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Dubai Monthly Cars',
}

// NOTE(owner): template content — have it reviewed by UAE legal counsel
// before production launch.
const sections = [
  {
    h: 'Information we collect',
    p: 'Account details you provide (name, email, phone), identity documents required for rental verification (Emirates ID, driving licence, passport), booking and payment records, and basic technical data needed to operate the service.',
  },
  {
    h: 'How we use it',
    p: 'To verify your identity (KYC), process bookings and payments, manage rentals and deposits, prevent fraud, and send booking, billing and renewal notifications.',
  },
  {
    h: 'Document storage',
    p: 'Identity documents are stored in private, access-controlled storage. Only you and authorized staff (for verification) can access them. Documents are never made public.',
  },
  {
    h: 'Sharing',
    p: 'We do not sell your data. Information is shared only where necessary to operate the rental (payment processing, roadside assistance, legal compliance with UAE authorities when required).',
  },
  {
    h: 'Your rights',
    p: 'You can review your personal details and documents from your profile and KYC pages, and contact support to request corrections or account deletion, subject to record-keeping obligations.',
  },
]

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 min-h-screen bg-[var(--background)]">
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
          <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Legal</p>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">Last updated: 2026 · Template — pending legal review.</p>
      <div className="mt-8 space-y-6">
        {sections.map((s) => (
          <section key={s.h} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="font-semibold">{s.h}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{s.p}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
