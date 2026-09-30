'use client'

import { useActionState } from 'react'
import { Wrench, Loader2 } from 'lucide-react'
import { scheduleMaintenance } from './actions'

const initialState: { ok?: boolean; error?: string } = {}

export default function MaintenanceForm({ vehicles }: { vehicles: Array<{ id: string; make: string; model: string; plate_number: string | null }> }) {
  const [state, formAction, isPending] = useActionState(scheduleMaintenance, initialState)

  return (
    <form action={formAction} className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Wrench className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="font-semibold">Schedule Service</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select name="vehicle_id" required defaultValue="" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm">
          <option value="" disabled>Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.make} {v.model} · {v.plate_number ?? v.id.slice(0, 6)}</option>
          ))}
        </select>
        <select name="type" required defaultValue="service" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm">
          <option value="service">Service</option>
          <option value="repair">Repair</option>
          <option value="inspection">Inspection</option>
          <option value="tires">Tires</option>
          <option value="insurance_renewal">Insurance renewal</option>
          <option value="registration_renewal">Registration renewal</option>
        </select>
        <input name="scheduled_date" type="date" required min={new Date().toISOString().slice(0, 10)} className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        <input name="mileage_at_service" type="number" min="0" placeholder="Mileage at service (km)" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        <input name="cost_aed" type="number" min="0" placeholder="Est. cost (AED)" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        <input name="description" placeholder="Notes (optional)" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm sm:col-span-2 lg:col-span-1" />
      </div>
      {state?.error && <p className="mt-3 text-sm text-red-500">{state.error}</p>}
      {state?.ok && <p className="mt-3 text-sm text-green-500">Scheduled.</p>}
      <button disabled={isPending} className="mt-4 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white disabled:opacity-50">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Schedule maintenance
      </button>
    </form>
  )
}
