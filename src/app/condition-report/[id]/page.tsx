import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ChevronLeft,
  Camera,
  Car,
  Sparkles,
  Gauge,
  Fuel,
  CheckCircle2,
} from 'lucide-react'
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

  const reportsWithUrls = await Promise.all(
    (reports ?? []).map(async (report) => ({
      ...report,
      condition_report_photos: await Promise.all(
        (report.condition_report_photos ?? []).map(async (photo) => {
          const { data } = await supabase.storage
            .from('condition-photos')
            .createSignedUrl(photo.storage_path, 3600)

          return {
            ...photo,
            signed_url: data?.signedUrl ?? null,
          }
        })
      ),
    }))
  )

  const isPickup = reportType === 'pickup'
  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-14 lg:px-8 lg:pb-14 lg:pt-16">
          <Link
            href="/condition-report"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--accent)]"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            Back to Reports
          </Link>

          <div className="mt-6 flex items-start gap-5">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
                isPickup
                  ? 'border-sky-500/20 bg-sky-500/10'
                  : 'border-emerald-500/20 bg-emerald-500/10'
              }`}
            >
              <Car
                className={`h-7 w-7 ${isPickup ? 'text-sky-600' : 'text-emerald-600'}`}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {isPickup ? 'Pickup Inspection' : 'Return Inspection'}
              </p>
              <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
                {isPickup ? 'Pickup' : 'Return'} Report
              </h1>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                {vehicle.make} {vehicle.model} · {vehicle.year ?? ''}
              </p>
              <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
                #{booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {/* Existing reports */}
        {reports && reports.length > 0 && (
          <div className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-2xl tracking-tight">
                  Submitted Reports
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {reports.length} report{reports.length === 1 ? '' : 's'} on file
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {reportsWithUrls.map((r) => (
                <div
                  key={r.id}
                  className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent p-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Camera className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-emerald-700">
                        Report submitted
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--foreground)]/70">
                        {new Date(r.created_at).toLocaleDateString('en-AE', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                        <Gauge className="h-3 w-3 text-[var(--accent)]" aria-hidden="true" />
                        Mileage
                      </p>
                      <p className="mt-1 font-serif text-lg tabular-nums tracking-tight">
                        {r.mileage?.toLocaleString()} km
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                        <Fuel className="h-3 w-3 text-[var(--accent)]" aria-hidden="true" />
                        Fuel Level
                      </p>
                      <p className="mt-1 font-serif text-lg tracking-tight">
                        {r.fuel_level}
                      </p>
                    </div>
                  </div>

                  {r.notes && (
                    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                        Notes
                      </p>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--foreground)]/80">
                        {r.notes}
                      </p>
                    </div>
                  )}

                  {r.condition_report_photos?.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                        Photos ({r.condition_report_photos.length})
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {r.condition_report_photos.map((photo) => {
                          if (!photo.signed_url) return null

                          return (
                            <a
                              key={photo.id}
                              href={photo.signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group aspect-square overflow-hidden rounded-xl border border-[var(--border)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-md"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.signed_url}
                                alt="Report"
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New form */}
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--border)] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Camera className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-xl tracking-tight">
                {reports?.length ? 'Submit Another Report' : 'Submit New Report'}
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Photos help protect you at handover
              </p>
            </div>
          </div>

          <div className="p-6">
            <ConditionReportForm
              bookingId={bookingId}
              type={reportType}
              vehicleName={`${vehicle.make} ${vehicle.model}`}
            />
          </div>
        </div>
      </section>
    </main>
  )
}