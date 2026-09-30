import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, AlertTriangle, DollarSign } from 'lucide-react'
import DamageReportForm from '../DamageReportForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function DamageReportPage({ params }: Props) {
  const { id: bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/damage-report/${bookingId}`)

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      vehicles ( make, model, year, plate_number )
    `)
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .single()

  if (error || !booking) notFound()

  const vehicle = Array.isArray(booking.vehicles)
    ? booking.vehicles[0]
    : booking.vehicles

  if (!vehicle) notFound()

  const { data: reports } = await supabase
    .from('damage_reports')
    .select(`
      id, description, estimated_cost_aed, charged_against_deposit, status, created_at,
      damage_report_photos ( id, storage_path )
    `)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  const statusStyles: Record<string, string> = {
    reported: 'bg-blue-500/10 text-blue-500',
    under_review: 'bg-yellow-500/10 text-yellow-500',
    charged: 'bg-red-500/10 text-red-500',
    resolved: 'bg-green-500/10 text-green-500',
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <Link
        href="/damage-report"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Damage Report</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {vehicle.make} {vehicle.model} · {vehicle.year ?? ''}
          </p>
          <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {reports && reports.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Submitted Reports
          </h2>
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {new Date(r.created_at).toLocaleDateString('en-AE', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    statusStyles[r.status] ?? statusStyles.reported
                  }`}
                >
                  {r.status.replace('_', ' ')}
                </span>
              </div>

              <p className="mt-3 text-sm">{r.description}</p>

              {r.estimated_cost_aed && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <DollarSign className="h-3.5 w-3.5 text-[var(--accent)]" />
                  <span className="text-[var(--muted-foreground)]">
                    Estimated cost:
                  </span>
                  <span className="font-semibold">
                    AED {Number(r.estimated_cost_aed).toLocaleString()}
                  </span>
                </div>
              )}

              {r.charged_against_deposit && (
                <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-500">
                  ⚠️ Charged against security deposit
                </p>
              )}

              {r.damage_report_photos?.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {r.damage_report_photos.map((photo: { id: string; storage_path: string }) => {
                    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/damage-reports/${photo.storage_path}`
                    return (
                      <a
                        key={photo.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square overflow-hidden rounded-lg border border-[var(--border)]"
                      >
                        <img
                          src={url}
                          alt="Damage"
                          className="h-full w-full object-cover"
                        />
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h2 className="mb-4 font-semibold">File New Damage Report</h2>
        <DamageReportForm
          bookingId={bookingId}
          vehicleName={`${vehicle.make} ${vehicle.model}`}
        />
      </div>
    </main>
  )
}