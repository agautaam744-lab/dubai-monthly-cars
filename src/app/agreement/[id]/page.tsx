import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, FileText } from 'lucide-react'
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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Bookings
      </Link>

      <div className="mt-6 mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
          <FileText className="h-6 w-6 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
            Legal Document
          </p>
          <h1 className="mt-1 text-2xl font-bold">Rental Agreement</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {vehicle.make} {vehicle.model} · Booking #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      <AgreementClient
        booking={booking}
        vehicle={vehicle}
        profile={{
          full_name: profile?.full_name ?? null,
          email: user.email ?? null,
          phone: profile?.phone ?? null,
        }}
      />
    </main>
  )
}