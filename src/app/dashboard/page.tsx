import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  CalendarDays,
  CarFront,
  FileCheck2,
  LogOut,
  WalletCards,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Customer Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Welcome back
          </h1>

          <p className="mt-2 text-[var(--muted-foreground)]">
            {user.email ??
              user.phone ??
              'Authenticated customer'}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/cars"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <CarFront className="h-6 w-6 text-[var(--accent)]" />

            <h2 className="mt-4 font-semibold">
              Browse Cars
            </h2>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Explore the available fleet.
            </p>
          </Link>

          <Link
            href="/kyc"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <FileCheck2 className="h-6 w-6 text-[var(--accent)]" />

            <h2 className="mt-4 font-semibold">
              KYC Documents
            </h2>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Upload and track document verification.
            </p>
          </Link>

          <Link
            href="/bookings"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <CalendarDays className="h-6 w-6 text-[var(--accent)]" />

            <h2 className="mt-4 font-semibold">
              My Booking
            </h2>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Continue your rental journey.
            </p>
          </Link>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <WalletCards className="h-6 w-6 text-[var(--accent)]" />

            <h2 className="mt-4 font-semibold">
              Payments
            </h2>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Payment history will appear here.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                Authentication
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Account is authenticated
              </h2>

              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Your Supabase session is active. We can now connect
                KYC, booking, payments and customer data to this account.
              </p>
            </div>

            <LogOut className="hidden h-6 w-6 text-[var(--muted-foreground)] sm:block" />
          </div>
        </div>
      </section>
    </main>
  )
}