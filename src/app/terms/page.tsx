import Link from 'next/link'
import { ChevronLeft, FileText } from 'lucide-react'

export const metadata = {
  title: 'Terms & Conditions | Dubai Monthly Cars',
}

// NOTE(owner): template content — have it reviewed by UAE legal counsel
// before production launch.
const sections = [
  {
    h: 'Rental model',
    p: 'Vehicles are rented on monthly subscription terms (1, 3, 6 or 12 months). The monthly rent, refundable security deposit, mileage cap and insurance level depend on the pricing tier you select at booking.',
  },
  {
    h: 'Eligibility & KYC',
    p: 'You must hold a valid UAE driving licence or International Driving Permit and complete identity verification (Emirates ID, licence, passport) before a booking can be activated.',
  },
  {
    h: 'Payments & deposits',
    p: 'The first payment (first month plus deposit and one-time add-ons) is due before activation. Recurring monthly rent is billed automatically for active rentals. Late payments incur a 5% penalty. Deposits are refunded after final inspection, minus approved damage, fines or outstanding charges.',
  },
  {
    h: 'Vehicle use',
    p: 'Use the vehicle lawfully within the UAE. You are responsible for traffic fines, tolls (Salik), fuel policy compliance and mileage limits. Report any damage immediately with photos. Subletting is prohibited.',
  },
  {
    h: 'Extensions & termination',
    p: 'Request extensions, early termination or vehicle swaps from your booking page. Early termination may carry fees stated in the rental agreement you sign.',
  },
]

export default function TermsPage() {
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
          <FileText className="h-6 w-6 text-[var(--accent)]" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Legal</p>
          <h1 className="text-3xl font-bold">Terms & Conditions</h1>
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
