'use client'

import { useActionState } from 'react'
import { Building2, Loader2 } from 'lucide-react'
import { createCorporateAccount } from './actions'

const initialState: { ok?: boolean; error?: string } = {}

export default function CorporateForm() {
  const [state, formAction, isPending] = useActionState(createCorporateAccount, initialState)

  return (
    <form action={formAction} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="font-semibold">Add Retainer Client</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="company_name" required placeholder="Company name" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none" />
        <input name="contact_person" required placeholder="Contact person" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none" />
        <input name="contact_phone" placeholder="Contact phone" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none" />
        <input name="trade_license" placeholder="Trade license no." className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none" />
        <input name="retainer_amount" type="number" min="0" required placeholder="Monthly retainer (AED)" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none" />
        <input name="guaranteed_vehicles" type="number" min="0" required placeholder="Guaranteed vehicles" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none" />
      </div>
      {state?.error && <p className="mt-3 text-sm text-red-500">{state.error}</p>}
      <button disabled={isPending} className="mt-4 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white disabled:opacity-50">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Add corporate account
      </button>
    </form>
  )
}
