'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, CheckCircle2, Loader2 } from 'lucide-react'
import { resolveDamageReport, chargeAgainstDeposit } from './actions'

export default function DamageActions({
  id,
  estimated,
  status,
}: {
  id: string
  estimated: number
  status: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [amount, setAmount] = useState(estimated > 0 ? estimated : 0)
  const [msg, setMsg] = useState('')

  if (status === 'resolved' || status === 'charged') return null

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="AED"
          aria-label="Charge amount in AED"
          className="min-h-[40px] w-28 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
        />
        <button
          type="button"
          disabled={isPending || amount <= 0}
          onClick={() =>
            startTransition(async () => {
              const res = await chargeAgainstDeposit(id, amount)
              setMsg(res.ok ? 'Charged to deposit.' : (res.error ?? 'Failed.'))
              router.refresh()
            })
          }
          className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-red-500/10 px-3 text-xs font-bold text-red-500 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
          Charge deposit
        </button>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await resolveDamageReport(id)
            setMsg(res.ok ? 'Resolved.' : (res.error ?? 'Failed.'))
            router.refresh()
          })
        }
        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Resolve without charge
      </button>
      {msg && <p className="text-xs text-[var(--muted-foreground)]">{msg}</p>}
    </div>
  )
}
