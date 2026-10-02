import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ChevronLeft,
  AlertTriangle,
  DollarSign,
  Sparkles,
  Car,
  Camera,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'
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

  const reportsWithUrls = await Promise.all(
    (reports ?? []).map(async (report) => ({
      ...report,
      damage_report_photos: await Promise.all(
        (report.damage_report_photos ?? []).map(async (photo) => {
          const { data } = await supabase.storage
            .from('damage-reports')
            .createSignedUrl(photo.storage_path, 3600)

          return {
            ...photo,
            signed_url: data?.signedUrl ?? null,
          }
        })
      ),
    }))
  )

  const statusConfig: Record<string, { label: string; className: string; icon: typeof AlertTriangle }> = {
    reported: {
      label: 'Reported',
      className: 'border-sky-500/20 bg-sky-500/10 text-sky-600',
      icon: AlertTriangle,
    },
    under_review: {
      label: 'Under Review',
      className: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
      icon: AlertTriangle,
    },
    charged: {
      label: 'Charged',
      className: 'border-red-500/20 bg-red-500/10 text-red-600',
      icon: DollarSign,
    },
    resolved: {
      label: 'Resolved',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
      icon: CheckCircle2,
    },
  }

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
            href="/damage-report"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--accent)]"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            Back to Damage Reports
          </Link>

          <div className="mt-6 flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Incident Report
              </p>
              <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
                Damage Report
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
        {/* VEHICLE CARD */}
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Car className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
              Vehicle
            </p>
            <p className="mt-0.5 truncate font-serif text-lg tracking-tight">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
              {vehicle.plate_number ?? 'No plate on file'}
            </p>
          </div>
        </div>

        {/* EXISTING REPORTS */}
        {reports && reports.length > 0 && (
          <div className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                <ShieldAlert className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
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
              {reportsWithUrls.map((r) => {
                const config = statusConfig[r.status] ?? statusConfig.reported
                const StatusIcon = config.icon

                return (
                  <div
                    key={r.id}
                    className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)]/40">
                          <Camera className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Report submitted</p>
                          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
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
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${config.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {config.label}
                      </span>
                    </div>

                    {r.description && (
                      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                          Description
                        </p>
                        <p className="mt-1.5 text-sm leading-6 text-[var(--foreground)]/80">
                          {r.description}
                        </p>
                      </div>
                    )}

                    {r.estimated_cost_aed && (
                      <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                          <DollarSign className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                            Estimated Cost
                          </p>
                          <p className="mt-0.5 font-serif text-lg tabular-nums tracking-tight text-[var(--accent)]">
                            AED {Number(r.estimated_cost_aed).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {r.charged_against_deposit && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="font-semibold">
                          Charged against security deposit
                        </span>
                      </div>
                    )}

                    {r.damage_report_photos?.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                          Photos ({r.damage_report_photos.length})
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {r.damage_report_photos.map((photo) => {
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
                                alt="Damage"
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </a>
                          )
                        })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* NEW FORM */}
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--border)] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <AlertTriangle className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-xl tracking-tight">
                File New Damage Report
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Photos help speed up the review process
              </p>
            </div>
          </div>

          <div className="p-6">
            <DamageReportForm
              bookingId={bookingId}
              vehicleName={`${vehicle.make} ${vehicle.model}`}
            />
          </div>
        </div>
      </section>
    </main>
  )
}