import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, Car, Calendar, CreditCard, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ id: string }>
}

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/bookings/${id}`)

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      end_date,
      duration_months,
      monthly_price_aed,
      deposit_aed,
      total_add_ons_aed,
      agreement_signed_at,
      created_at,
      vehicles ( make, model, year, plate_number ),
      pricing_tiers ( name, mileage_limit_km )
    `)
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!booking) notFound()

  const vehicle = Array.isArray(booking.vehicles) ? booking.vehicles[0] : booking.vehicles
  const tier = Array.isArray(booking.pricing_tiers) ? booking.pricing_tiers[0] : booking.pricing_tiers

  const total =
    Number(booking.monthly_price_aed || 0) +
    Number(booking.deposit_aed || 0) +
    Number(booking.total_add_ons_aed || 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to My Bookings
      </Link>

      <div className="mt-6 mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Booking Details
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {vehicle?.make} {vehicle?.model}
        </h1>
        <p className="mt-1 font-mono text-sm text-[var(--muted-foreground)]">
          #{booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Vehicle</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-[var(--muted-foreground)]">Car:</span> {vehicle?.make} {vehicle?.model} ({vehicle?.year ?? '—'})</p>
            <p><span className="text-[var(--muted-foreground)]">Plate:</span> {vehicle?.plate_number ?? '—'}</p>
            <p><span className="text-[var(--muted-foreground)]">Plan:</span> {tier?.name ?? 'Basic'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Rental Period</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-[var(--muted-foreground)]">Start:</span> {new Date(booking.start_date).toLocaleDateString('en-AE')}</p>
            <p><span className="text-[var(--muted-foreground)]">Duration:</span> {booking.duration_months} month{booking.duration_months > 1 ? 's' : ''}</p>
            <p><span className="text-[var(--muted-foreground)]">Status:</span> {booking.status.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Payment</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between"><span className="text-[var(--muted-foreground)]">Monthly Rent:</span> <span className="font-medium">{formatAED(Number(booking.monthly_price_aed))}</span></p>
            <p className="flex justify-between"><span className="text-[var(--muted-foreground)]">Deposit:</span> <span className="font-medium">{formatAED(Number(booking.deposit_aed))}</span></p>
            <p className="flex justify-between"><span className="text-[var(--muted-foreground)]">Add-ons:</span> <span className="font-medium">{formatAED(Number(booking.total_add_ons_aed))}</span></p>
            <p className="flex justify-between border-t border-[var(--border)] pt-2 text-base font-bold"><span>Total:</span> <span>{formatAED(total)}</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Agreement</h2>
          </div>
          {booking.agreement_signed_at ? (
            <p className="text-sm text-green-500">
              ✓ Signed on {new Date(booking.agreement_signed_at).toLocaleDateString('en-AE', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Agreement not signed yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}