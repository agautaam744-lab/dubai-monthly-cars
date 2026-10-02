import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, FileText, Sparkles } from 'lucide-react'
import AgreementClient from './AgreementClient'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AgreementPage({ params }: Props) {
  const { id: bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/agreement/${bookingId}`)

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_date,
      duration_months,
      monthly_price_aed,
      deposit_aed,
      delivery_type,
      delivery_address,
      agreement_signed_at,
      vehicles ( make, model, year, plate_number )
    `)
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .single()

  if (error || !booking) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  const vehicle = Array.isArray(booking.vehicles)
    ? booking.vehicles[0]
    : booking.vehicles

  if (!vehicle) notFound()

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-14 lg:px-8 lg:pb-14 lg:pt-16">
          <Link
            href="/bookings"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--accent)]"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            Back to Bookings
          </Link>

          <div className="mt-6 flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10">
              <FileText className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Legal Document
              </p>
              <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
                Rental Agreement
              </h1>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                {vehicle.make} {vehicle.model} · Booking #{booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <AgreementClient
          booking={booking}
          vehicle={vehicle}
          profile={{
            full_name: profile?.full_name ?? null,
            email: user.email ?? null,
            phone: profile?.phone ?? null,
          }}
        />
      </section>
    </main>
  )
}