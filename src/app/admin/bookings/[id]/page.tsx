import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Car, Calendar, User, CreditCard, FileText } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import BookingManager from './BookingManager'
import RefundForm from '@/app/admin/finance/RefundForm'

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
  const { supabase } = await requireAdmin()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      duration_months,
      monthly_price_aed,
      deposit_aed,
      total_add_ons_aed,
      agreement_signed_at,
      created_at,
      vehicles ( make, model, year, plate_number ),
      pricing_tiers ( name, mileage_limit_km ),
      profiles:customer_id ( full_name, email, phone )
    `)
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const { data: originalPayment } = await supabase
    .from('payments')
    .select('id, amount_aed')
    .eq('booking_id', id)
    .eq('type', 'deposit')
    .eq('status', 'succeeded')
    .limit(1)
    .maybeSingle()

  const vehicle = Array.isArray(booking.vehicles) ? booking.vehicles[0] : booking.vehicles
  const tier = Array.isArray(booking.pricing_tiers) ? booking.pricing_tiers[0] : booking.pricing_tiers
  const customer = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles

  const total =
    Number(booking.monthly_price_aed || 0) +
    Number(booking.deposit_aed || 0) +
    Number(booking.total_add_ons_aed || 0)

  const canRefund = ['completed', 'terminated', 'cancelled'].includes(booking.status)

  return (
    <div className="p-6 sm:p-8">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Bookings
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
            <User className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Customer</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-[var(--muted-foreground)]">Name:</span> {customer?.full_name ?? '—'}</p>
            <p><span className="text-[var(--muted-foreground)]">Email:</span> {customer?.email ?? '—'}</p>
            <p><span className="text-[var(--muted-foreground)]">Phone:</span> {customer?.phone ?? '—'}</p>
          </div>
        </div>

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
              Signed on {new Date(booking.agreement_signed_at).toLocaleDateString('en-AE', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Agreement not signed yet.
            </p>
          )}
        </div>

        {canRefund && (
          <div className="rounded-2xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-transparent p-5 sm:p-6 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                  <CreditCard className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                    Deposit Refund
                  </p>
                  <p className="mt-1 font-serif text-3xl tabular-nums tracking-tight text-[var(--accent)]">
                    {formatAED(Number(booking.deposit_aed))}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    Refundable deposit for {vehicle?.make} {vehicle?.model}
                  </p>
                </div>
              </div>

              <RefundForm
                bookingId={booking.id}
                originalPaymentId={originalPayment?.id ?? null}
                depositAmount={Number(booking.deposit_aed)}
                bookingLabel={(vehicle?.make ?? '') + ' ' + (vehicle?.model ?? '')}
              />
            </div>
          </div>
        )}

        <div className="lg:col-span-2">
          <BookingManager bookingId={booking.id} status={booking.status} />
        </div>
      </div>
    </div>
  )
}