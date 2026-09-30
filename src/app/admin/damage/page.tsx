import { requireAdmin } from '@/lib/admin'
import { AlertTriangle, CheckCircle, DollarSign, FileText, Car } from 'lucide-react'
import DamageActions from './DamageActions'
import type { DamageReportRow } from '@/types/database'
import { first } from '@/types/database'

export default async function AdminDamagePage() {
  const { supabase } = await requireAdmin()

  const { data: reports, error } = await supabase
    .from('damage_reports')
    .select(`
      id,
      description,
      estimated_cost_aed,
      charged_against_deposit,
      status,
      created_at,
      bookings (
        id,
        vehicles ( make, model, plate_number ),
        profiles:customer_id ( full_name, phone )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>
  }

  const allReports = (reports ?? []) as DamageReportRow[]
  const underReview = allReports.filter(r => r.status === 'under_review').length
  const charged = allReports.filter(r => r.status === 'charged').length
  const resolved = allReports.filter(r => r.status === 'resolved').length

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Risk Management</p>
        <h1 className="mt-2 text-3xl font-bold">Damage & Incidents</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Review condition reports, assess damage, and manage deposit charges.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Under Review</p>
              <p className="text-2xl font-bold">{underReview}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <DollarSign className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Charged to Deposit</p>
              <p className="text-2xl font-bold">{charged}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Resolved</p>
              <p className="text-2xl font-bold">{resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {allReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <h2 className="mt-4 font-semibold">No damage reports yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Vehicle damage or incident reports will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allReports.map((report) => {
            const booking = report.bookings ?? null
            const vehicle = first(booking?.vehicles ?? null)
            const customer = first(booking?.profiles ?? null)

            return (
              <div key={report.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                      <Car className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">
                          {vehicle?.make} {vehicle?.model}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          report.status === 'under_review' ? 'bg-blue-500/10 text-blue-600' :
                          report.status === 'charged' ? 'bg-red-500/10 text-red-600' :
                          'bg-green-500/10 text-green-600'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        Customer: {customer?.full_name || 'Unknown'} · {customer?.phone || 'No phone'}
                      </p>
                      <p className="mt-1 text-sm text-[var(--foreground)]">
                        <span className="font-semibold">Issue:</span> {report.description || 'No description provided'}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Plate: {vehicle?.plate_number || 'N/A'} · Reported: {report.created_at ? new Date(report.created_at).toLocaleDateString('en-AE') : '—'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-xs text-[var(--muted-foreground)]">Estimated Cost</p>
                      <p className="text-lg font-bold text-red-500">
                        AED {Number(report.estimated_cost_aed || 0).toLocaleString()}
                      </p>
                    </div>
                    {report.charged_against_deposit && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-600">
                        <DollarSign className="h-3 w-3" /> Charged to Deposit
                      </span>
                    )}
                    <DamageActions
                      id={report.id}
                      estimated={Number(report.estimated_cost_aed || 0)}
                      status={report.status}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}