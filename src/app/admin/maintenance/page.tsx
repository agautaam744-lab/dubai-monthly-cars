import { requireAdmin } from '@/lib/admin'
import { Wrench, Calendar, CheckCircle2, AlertCircle, Car } from 'lucide-react'
import MaintenanceForm from './MaintenanceForm'
import CompleteButton from './CompleteButton'
import type { MaintenanceRow } from '@/types/database'
import { first } from '@/types/database'

export default async function AdminMaintenancePage() {
  const { supabase } = await requireAdmin()

  const [{ data: records, error }, { data: vehicles }] = await Promise.all([
    supabase
      .from('maintenance_records')
      .select(`
        id,
        type,
        description,
        scheduled_date,
        completed_date,
        mileage_at_service,
        cost_aed,
        status,
        vehicles ( make, model, plate_number )
      `)
      .order('scheduled_date', { ascending: true }),
    supabase.from('vehicles').select('id, make, model, plate_number').order('make'),
  ])

  if (error) {
    return <div className="p-8 text-red-500">Error loading maintenance records: {error.message}</div>
  }

  const allRecords = (records ?? []) as MaintenanceRow[]

  // Calculate stats
  const scheduled = allRecords.filter(r => r.status === 'scheduled').length
  const completed = allRecords.filter(r => r.status === 'completed').length
  const overdue = allRecords.filter(r => r.status === 'overdue').length

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-600',
    completed: 'bg-green-500/10 text-green-600',
    overdue: 'bg-red-500/10 text-red-600',
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Fleet Management</p>
        <h1 className="mt-2 text-3xl font-bold">Maintenance Scheduling</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Track vehicle service, repairs, and inspections.</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Scheduled</p>
              <p className="text-2xl font-bold">{scheduled}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Overdue</p>
              <p className="text-2xl font-bold">{overdue}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Completed</p>
              <p className="text-2xl font-bold">{completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Records List */}
      <MaintenanceForm vehicles={vehicles ?? []} />
      {allRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Wrench className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <h2 className="mt-4 font-semibold">No maintenance records yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Schedule your first vehicle service to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allRecords.map((record) => {
            const v = first(record.vehicles ?? null)
            return (
            <div key={record.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                    <Car className="h-6 w-6 text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{v?.make} {v?.model}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[record.status] || 'bg-gray-500/10 text-gray-600'}`}>
                        {record.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {record.type} · {record.description}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Plate: {v?.plate_number || 'N/A'} · Scheduled: {record.scheduled_date ? new Date(record.scheduled_date).toLocaleDateString('en-AE') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted-foreground)]">Cost</p>
                  <p className="text-lg font-bold">AED {record.cost_aed || 0}</p>
                  {record.status !== 'completed' && (
                    <div className="mt-2">
                      <CompleteButton id={record.id} />
                    </div>
                  )}
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