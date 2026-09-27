import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Camera, Car } from 'lucide-react'
import ConditionReportForm from '../ConditionReportForm'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function ConditionReportPage({
  params,
  searchParams,
}: Props) {
  const { id: bookingId } = await params
  const { type } = await searchParams
  const reportType = (type === 'return' ? 'return' : 'pickup') as
    | 'pickup'
    | 'return'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user)
    redirect(`/login?next=/condition-report/${bookingId}?type=${reportType}`)

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
    .from('condition_reports')
    .select(`
      id, type, mileage, fuel_level, notes, created_at,
      condition_report_photos ( id, storage_path )
    `)
    .eq('booking_id', bookingId)
    .eq('type', reportType)
    .order('created_at', { ascending: false })

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[var(--background)]">
      <Link
        href="/condition-report"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
          <Car className="h-6 w-6 text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {reportType === 'pickup' ? 'Pickup' : 'Return'} Report
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {vehicle.make} {vehicle.model} · {vehicle.year ?? ''}
          </p>
          <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Existing reports */}
      {reports && reports.length > 0 && (
        <div className="mt-6 space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-green-500/30 bg-green-500/5 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-green-500">
                <Camera className="h-4 w-4" />
                Report submitted on{' '}
                {new Date(r.created_at).toLocaleDateString('en-AE', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[var(--muted-foreground)]">Mileage</p>
                  <p className="font-semibold">{r.mileage?.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">Fuel</p>
                  <p className="font-semibold">{r.fuel_level}</p>
                </div>
              </div>
              {r.notes && (
                <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                  {r.notes}
                </p>
              )}
              {r.condition_report_photos?.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {r.condition_report_photos.map((photo: any) => {
                    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/condition-photos/${photo.storage_path}`
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
                          alt="Report"
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

      {/* New form */}
      <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h2 className="mb-4 font-semibold">
          {reports?.length ? 'Submit Another Report' : 'Submit New Report'}
        </h2>
        <ConditionReportForm
          bookingId={bookingId}
          type={reportType}
          vehicleName={`${vehicle.make} ${vehicle.model}`}
        />
      </div>
    </main>
  )
}