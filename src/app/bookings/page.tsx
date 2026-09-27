import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Trash2,
  FileText,
} from 'lucide-react'

export default async function MyBookingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      duration_months,
      delivery_type,
      monthly_price_aed,
      deposit_aed,
      total_add_ons_aed,
      agreement_signed_at,
      created_at,
      vehicles (
        make,
        model,
        year,
        category
      ),
      pricing_tiers (
        name
      )
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings:', error)
  }

  const formatAED = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_kyc':
        return (
          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-500">
            Pending KYC
          </span>
        )
      case 'pending_agreement':
        return (
          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-500">
            Pending Agreement
          </span>
        )
      case 'pending_payment':
        return (
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
            Pending Payment
          </span>
        )
      case 'active':
        return (
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-500">
            Active
          </span>
        )
      case 'cancelled':
        return (
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-500">
            {status}
          </span>
        )
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Customer Account
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)]">
          My Bookings
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Track your rental requests, dates, plan, delivery option and current booking status.
        </p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Car className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
            No bookings yet
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            You haven't made any rental bookings yet.
          </p>
          <Link
            href="/cars"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            Browse Cars
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const vehicle = Array.isArray(booking.vehicles)
              ? booking.vehicles[0]
              : booking.vehicles
            const tier = Array.isArray(booking.pricing_tiers)
              ? booking.pricing_tiers[0]
              : booking.pricing_tiers

            if (!vehicle) return null

            const totalEstimate =
              Number(booking.monthly_price_aed || 0) +
              Number(booking.deposit_aed || 0) +
              Number(booking.total_add_ons_aed || 0)

            const needsAgreement =
              !booking.agreement_signed_at &&
              booking.status !== 'cancelled' &&
              booking.status !== 'active'

            return (
              <div
                key={booking.id}
                className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all hover:shadow-md"
              >
                {/* Top Section */}
                <div className="p-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                        <Car className="h-6 w-6 text-[var(--accent)]" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-[var(--foreground)]">
                            {vehicle.make} {vehicle.model}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          Booking ID: {booking.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-[var(--foreground)]">
                        {formatAED(Number(booking.monthly_price_aed))}
                        <span className="text-sm font-normal text-[var(--muted-foreground)]">
                          {' '}
                          /month
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-6 sm:grid-cols-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <Calendar className="h-3.5 w-3.5" />
                        Start date
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
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
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                        {booking.duration_months}{' '}
                        {booking.duration_months === 1 ? 'month' : 'months'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <MapPin className="h-3.5 w-3.5" />
                        Delivery
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                        {booking.delivery_type === 'pickup' ? 'Pickup' : 'Home delivery'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Plan
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                        {tier?.name || 'Basic'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Section - Action Bar */}
                <div className="border-t border-[var(--border)] bg-[var(--muted)]/50 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Initial amount estimate
                      </p>
                      <p className="text-lg font-bold text-[var(--foreground)]">
                        {formatAED(totalEstimate)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Details - always */}
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                      >
                        View Details
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>

                      {/* Sign Agreement - if needed */}
                      {needsAgreement && (
                        <Link
                          href={`/agreement/${booking.id}`}
                          className="flex items-center gap-2 rounded-xl border border-orange-500/50 bg-orange-500/5 px-4 py-2.5 text-xs font-semibold text-orange-500 transition hover:bg-orange-500/10"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Sign Agreement
                        </Link>
                      )}

                      {/* Pending KYC */}
                      {booking.status === 'pending_kyc' && (
                        <Link
                          href={`/kyc?next=/bookings`}
                          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
                        >
                          <FileText className="h-4 w-4" />
                          Complete KYC
                        </Link>
                      )}

                      {/* Pending Payment */}
                      {booking.status === 'pending_payment' && (
                        <Link
                          href={`/payments?booking=${booking.id}`}
                          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay Now
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}

                      {/* Active */}
                      {booking.status === 'active' && (
                        <Link
                          href={`/dashboard`}
                          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
                        >
                          Open Dashboard
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}