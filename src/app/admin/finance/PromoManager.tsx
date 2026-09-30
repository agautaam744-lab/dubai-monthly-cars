'use client'

import { useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, Loader2 } from 'lucide-react'
import { createPromoCode, togglePromoCode } from './promoActions'

const initialState: { ok?: boolean; error?: string } = {}

export default function PromoManager({
  promos,
  missingTable,
}: {
  promos: Array<{ id: string; code: string; discount_percent: number; max_uses: number | null; is_active: boolean; expires_at: string | null }>
  missingTable: boolean
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createPromoCode, initialState)
  const [toggling, startToggle] = useTransition()

  if (missingTable) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted-foreground)]">
        <p className="font-semibold text-[var(--foreground)]">Promo codes unavailable</p>
        <p className="mt-1">The <code>promo_codes</code> table is not provisioned yet. Create it (columns: code, discount_percent, max_uses, expires_at, is_active) to enable promo management.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Tag className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="font-semibold">Promo Codes</h2>
      </div>
      <form action={formAction} className="grid gap-2 sm:grid-cols-[1fr_110px_110px_150px_auto]">
        <input name="code" required placeholder="CODE, e.g. RAMADAN10" className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 font-mono text-sm uppercase" />
        <input name="discount_percent" type="number" min={1} max={90} required placeholder="% off" className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        <input name="max_uses" type="number" min={1} placeholder="Max uses" className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        <input name="expires_at" type="date" className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        <button disabled={isPending} className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white disabled:opacity-50">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Add
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-500">{state.error}</p>}
      <div className="mt-4 space-y-2">
        {promos.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">No promo codes yet.</p>}
        {promos.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--muted)]/50 px-3 py-2 text-sm">
            <span className="font-mono font-bold">{p.code}</span>
            <span className="text-[var(--muted-foreground)]">{p.discount_percent}% off{p.max_uses ? ` · max ${p.max_uses}` : ''}{p.expires_at ? ` · till ${p.expires_at}` : ''}</span>
            <button
              type="button"
              disabled={toggling}
              onClick={() => startToggle(async () => {
                await togglePromoCode(p.id, !p.is_active)
                router.refresh()
              })}
              className={`rounded-full px-3 py-1 text-xs font-bold ${p.is_active ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'}`}
            >
              {p.is_active ? 'Active' : 'Paused'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
