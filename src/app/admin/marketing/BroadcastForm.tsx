'use client'

import { useActionState } from 'react'
import { Megaphone, Loader2 } from 'lucide-react'
import { sendBroadcast } from './actions'

const initialState: { ok?: boolean; error?: string; count?: number } = {}

export default function BroadcastForm() {
  const [state, formAction, isPending] = useActionState(sendBroadcast, initialState)

  return (
    <form action={formAction} className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="font-semibold">New Campaign Broadcast</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <input name="title" required placeholder="Campaign title, e.g. Ramadan 10% off renewals" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none" />
        <select name="type" defaultValue="promo" className="min-h-[46px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm">
          <option value="promo">Promotion</option>
          <option value="loyalty">Loyalty offer</option>
          <option value="renewal">Renewal deal</option>
          <option value="general">General</option>
        </select>
      </div>
      <textarea name="body" required rows={2} placeholder="Message shown in the notification center…" className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none" />
      {state?.error && <p className="mt-2 text-sm text-red-500">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-sm text-green-500">Sent to {state.count} customers.</p>}
      <button disabled={isPending} className="mt-3 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white disabled:opacity-50">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Send to all customers
      </button>
    </form>
  )
}
