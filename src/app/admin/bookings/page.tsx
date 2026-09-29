

import Link from 'next/link'
import { CalendarCheck, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'

export default async function AdminBookingsPage() {
  const { supabase } = await requireAdmin()

  const { data: bookings, error } = await supabase
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
      vehicles ( make, model, year ),
      pricing_tiers ( name ),
      profiles:customer_id ( full_name, email )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
          Error: {error.message}
        </p>
      </div>
    )
  }

  const all = bookings ?? []

  const stats = [
    {
      label: 'Total Bookings',
      value: all.length,
      icon: CalendarCheck,
      color: 'text-[var(--accent)] bg-[var(--accent)]/10',
    },
    {
      label: 'Active Rentals',
      value: all.filter((b) => b.status === 'active').length,
      icon: CheckCircle2,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      label: 'Pending',
      value: all.filter((b) => b.status.startsWith('pending')).length,
      icon: Clock,
      color: 'text-yellow-500 bg-yellow-500/10',
    },
    {
      label: 'Cancelled',
      value: all.filter((b) => b.status === 'cancelled').length,
      icon: XCircle,
      color: 'text-red-500 bg-red-500/10',
    },
  ]

  const statusConfig: Record<string, string> = {
    pending_kyc: 'bg-yellow-500/10 text-yellow-600',
    pending_payment: 'bg-blue-500/10 text-blue-600',
    pending_agreement: 'bg-orange-500/10 text-orange-600',
    active: 'bg-green-500/10 text-green-600',
    completed: 'bg-gray-500/10 text-gray-600',
    cancelled: 'bg-red-500/10 text-red-600',
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Management
        </p>
        <h1 className="mt-2 text-3xl font-bold">Bookings</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          View and manage all customer bookings.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bookings list - inline, no separate component */}
      {all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <h2 className="mt-4 font-semibold">No bookings yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Customer bookings will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {all.map((booking: any) => {
            const vehicle = Array.isArray(booking.vehicles)
              ? booking.vehicles[0]
              : booking.vehicles
            const customer = Array.isArray(booking.profiles)
              ? booking.profiles[0]
              : booking.profiles
            const tier = Array.isArray(booking.pricing_tiers)
              ? booking.pricing_tiers[0]
              : booking.pricing_tiers

            const total =
              Number(booking.monthly_price_aed || 0) +
              Number(booking.deposit_aed || 0) +
              Number(booking.total_add_ons_aed || 0)

            return (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--accent)]/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">
                        {vehicle?.make} {vehicle?.model}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          statusConfig[booking.status] ?? ''
                        }`}
                      >
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      #{booking.id.slice(0, 8).toUpperCase()} · {customer?.full_name ?? 'Customer'} · {customer?.email ?? ''}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Start: {new Date(booking.start_date).toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' })} · {booking.duration_months} month{booking.duration_months > 1 ? 's' : ''} · {tier?.name ?? 'Basic'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--muted-foreground)]">Total</p>
                    <p className="text-lg font-bold">
                      AED {total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}