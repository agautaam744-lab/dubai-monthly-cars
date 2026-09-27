import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ChevronLeft,
  Car,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CreditCard,
  FileText,
} from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

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
      duration_months,
      delivery_type,
      delivery_address,
      monthly_price_aed,
      deposit_aed,
      total_add_ons_aed,
      agreement_signed_at,
      vehicles ( make, model, year, category, location, plate_number ),
      pricing_tiers ( name, mileage_limit_km )
    `)
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (!booking) notFound()

  const vehicle = Array.isArray(booking.vehicles)
    ? booking.vehicles[0]
    : booking.vehicles
  const tier = Array.isArray(booking.pricing_tiers)
    ? booking.pricing_tiers[0]
    : booking.pricing_tiers

  if (!vehicle) notFound()

  const total =
    Number(booking.monthly_price_aed || 0) +
    Number(booking.deposit_aed || 0) +
    Number(booking.total_add_ons_aed || 0)

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Bookings
      </Link>

      <h1 className="mt-6 text-3xl font-bold">Booking Details</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        #{booking.id.slice(0, 8).toUpperCase()}
      </p>

      {/* Vehicle Info */}
      <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Car className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {vehicle.make} {vehicle.model}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {vehicle.year ?? ''}
              {vehicle.category ? ` · ${vehicle.category}` : ''}
              {vehicle.plate_number ? ` · ${vehicle.plate_number}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-5 border-t border-[var(--border)] pt-5 sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Calendar className="h-3.5 w-3.5" />
              Start
            </div>
            <p className="mt-1 text-sm font-semibold">
              {new Date(booking.start_date).toLocaleDateString('en-AE', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Clock className="h-3.5 w-3.5" />
              Duration
            </div>
            <p className="mt-1 text-sm font-semibold">
              {booking.duration_months} month{booking.duration_months > 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <MapPin className="h-3.5 w-3.5" />
              Delivery
            </div>
            <p className="mt-1 text-sm font-semibold">
              {booking.delivery_type === 'pickup' ? 'Pickup' : 'Home delivery'}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Plan
            </div>
            <p className="mt-1 text-sm font-semibold">{tier?.name ?? 'Basic'}</p>
          </div>
        </div>
      </section>

      {/* Payment Summary */}
      <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h2 className="mb-4 font-semibold">Payment Summary</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Monthly rent</span>
            <span className="font-medium">{formatAED(Number(booking.monthly_price_aed))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Add-ons</span>
            <span className="font-medium">{formatAED(Number(booking.total_add_ons_aed))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Security deposit</span>
            <span className="font-medium">{formatAED(Number(booking.deposit_aed))}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-3 text-base font-bold">
            <span>Total</span>
            <span>{formatAED(total)}</span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        {!booking.agreement_signed_at && (
          <Link
            href={`/agreement/${booking.id}`}
            className="flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 transition hover:border-orange-500/60"
          >
            <FileText className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-semibold">Sign Agreement</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Required before pickup
              </p>
            </div>
          </Link>
        )}

        {booking.status === 'pending_payment' && (
          <Link
            href={`/payments?booking=${booking.id}`}
            className="flex items-center gap-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 transition hover:border-[var(--accent)]/60"
          >
            <CreditCard className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p className="text-sm font-semibold">Pay Now</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Complete your booking
              </p>
            </div>
          </Link>
        )}
      </section>
    </main>
  )
}