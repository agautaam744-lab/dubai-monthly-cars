import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  CreditCard,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Home,
  Package,
} from 'lucide-react'

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/bookings/${id}`)
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      end_date,
      duration_months,
      delivery_type,
      delivery_address,
      monthly_price_aed,
      deposit_aed,
      total_add_ons_aed,
      agreement_signed_at,
      created_at,
      vehicles (
        id, make, model, year, category, location, description, plate_number
      ),
      pricing_tiers (
        id, name, mileage_limit_km, insurance_level, includes_delivery
      )
    `)
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  if (error || !booking) notFound()

  const { data: bookingAddOns } = await supabase
    .from('booking_add_ons')
    .select(`
      id, quantity, price_aed,
      add_ons ( name, price_type, description )
    `)
    .eq('booking_id', id)

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount_aed, type, status, provider, paid_at, created_at')
    .eq('booking_id', id)
    .order('created_at', { ascending: false })

  const { data: documents } = await supabase
    .from('documents')
    .select('id, type, status, reviewed_at')
    .eq('user_id', user.id)

  const vehicle = Array.isArray(booking.vehicles)
    ? booking.vehicles[0]
    : booking.vehicles
  const tier = Array.isArray(booking.pricing_tiers)
    ? booking.pricing_tiers[0]
    : booking.pricing_tiers

  if (!vehicle) notFound()

  const monthlyRent = Number(booking.monthly_price_aed || 0)
  const deposit = Number(booking.deposit_aed || 0)
  const addOnTotal = Number(booking.total_add_ons_aed || 0)
  const total = monthlyRent + deposit + addOnTotal

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending_kyc: {
      label: 'Pending KYC',
      color: 'text-yellow-500 bg-yellow-500/10',
      icon: AlertCircle,
    },
    pending_payment: {
      label: 'Pending Payment',
      color: 'text-blue-500 bg-blue-500/10',
      icon: CreditCard,
    },
    active: {
      label: 'Active Rental',
      color: 'text-green-500 bg-green-500/10',
      icon: CheckCircle2,
    },
    completed: {
      label: 'Completed',
      color: 'text-gray-500 bg-gray-500/10',
      icon: CheckCircle2,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-red-500 bg-red-500/10',
      icon: XCircle,
    },
    pending_agreement: {
      label: 'Pending Agreement',
      color: 'text-orange-500 bg-orange-500/10',
      icon: FileText,
    },
  }

  const currentStatus =
    statusConfig[booking.status] ?? statusConfig.pending_kyc
  const StatusIcon = currentStatus.icon

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      {/* Back Link */}
      <Link
        href="/bookings"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to My Bookings
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
            Booking Details
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-1 font-mono text-sm text-[var(--muted-foreground)]">
            ID: {booking.id.toUpperCase()}
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold ${currentStatus.color}`}
        >
          <StatusIcon className="h-4 w-4" />
          {currentStatus.label}
        </div>
      </div>

      {/* Action Banner (based on status) */}
      {booking.status === 'pending_payment' && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              Complete your payment to activate this booking
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Pay {formatAED(total)} to confirm your rental.
            </p>
          </div>
          <Link
            href={`/payments?booking=${booking.id}`}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            <CreditCard className="h-4 w-4" />
            Pay Now
          </Link>
        </div>
      )}

      {booking.status === 'pending_kyc' && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              KYC verification required
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Upload your documents to continue.
            </p>
          </div>
          <Link
            href={`/kyc?next=/bookings/${booking.id}`}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            <FileText className="h-4 w-4" />
            Complete KYC
          </Link>
        </div>
      )}

      {/* Vehicle Card */}
      <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-4 border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Car className="h-7 w-7 text-[var(--accent)]" />
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

        <div className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-4 sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Calendar className="h-3.5 w-3.5" />
              Start date
            </div>
            <p className="mt-1.5 text-sm font-semibold">
              {new Date(booking.start_date).toLocaleDateString('en-AE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Clock className="h-3.5 w-3.5" />
              Duration
            </div>
            <p className="mt-1.5 text-sm font-semibold">
              {booking.duration_months}{' '}
              {booking.duration_months === 1 ? 'month' : 'months'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              {booking.delivery_type === 'pickup' ? (
                <MapPin className="h-3.5 w-3.5" />
              ) : (
                <Home className="h-3.5 w-3.5" />
              )}
              Delivery
            </div>
            <p className="mt-1.5 text-sm font-semibold">
              {booking.delivery_type === 'pickup' ? 'Pickup' : 'Home delivery'}
            </p>
            {booking.delivery_address && (
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                {booking.delivery_address}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Plan
            </div>
            <p className="mt-1.5 text-sm font-semibold">
              {tier?.name ?? 'Basic'}
            </p>
            {tier?.mileage_limit_km && (
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                {tier.mileage_limit_km.toLocaleString()} km/month
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Payment Breakdown */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Payment Breakdown</h2>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">
              First month rent ({tier?.name ?? 'Basic'})
            </span>
            <span className="font-medium">{formatAED(monthlyRent)}</span>
          </div>

          {bookingAddOns && bookingAddOns.length > 0 && (
            <div className="space-y-2 border-t border-dashed border-[var(--border)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Add-ons
              </p>
              {bookingAddOns.map((item) => {
                const addOn = Array.isArray(item.add_ons)
                  ? item.add_ons[0]
                  : item.add_ons
                if (!addOn) return null
                return (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-[var(--muted-foreground)]">
                      {addOn.name}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                    </span>
                    <span className="font-medium">
                      {formatAED(Number(item.price_aed))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">
              Security deposit (refundable)
            </span>
            <span className="font-medium">{formatAED(deposit)}</span>
          </div>

          <div className="flex items-end justify-between border-t border-[var(--border)] pt-4">
            <span className="text-sm font-medium">Total booking value</span>
            <span className="text-2xl font-bold">{formatAED(total)}</span>
          </div>
        </div>
      </section>

      {/* Payment History */}
      {payments && payments.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="font-semibold">Payment History</h2>
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div>
                  <p className="font-medium capitalize">
                    {payment.type.replace('_', ' ')}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {payment.paid_at
                      ? new Date(payment.paid_at).toLocaleString('en-AE')
                      : new Date(payment.created_at).toLocaleString('en-AE')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {formatAED(Number(payment.amount_aed))}
                  </span>
                  <span
                    className={[
                      'rounded-full px-2.5 py-1 text-xs font-semibold',
                      payment.status === 'succeeded'
                        ? 'bg-green-500/10 text-green-500'
                        : payment.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500',
                    ].join(' ')}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Documents / KYC Status */}
      {documents && documents.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="font-semibold">KYC Documents</h2>
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-5 sm:p-6"
              >
                <p className="font-medium capitalize">
                  {doc.type.replace('_', ' ')}
                </p>
                <span
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    doc.status === 'approved'
                      ? 'bg-green-500/10 text-green-500'
                      : doc.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500',
                  ].join(' ')}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}