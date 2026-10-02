'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  RotateCcw,
  Loader2,
  AlertCircle,
  Check,
  Wallet,
  Building2,
  CreditCard,
  X,
} from 'lucide-react'
import { processRefund } from './refundActions'

type RefundMethod = 'wallet' | 'bank_transfer' | 'original_method'

export default function RefundForm({
  bookingId,
  originalPaymentId,
  depositAmount,
  bookingLabel,
}: {
  bookingId: string
  originalPaymentId: string | null
  depositAmount: number
  bookingLabel: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(depositAmount))
  const [reason, setReason] = useState('')
  const [method, setMethod] = useState<RefundMethod>('wallet')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const reset = () => {
    setAmount(String(depositAmount))
    setReason('')
    setMethod('wallet')
    setMsg('')
    setError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMsg('')

    const result = await processRefund({
      bookingId,
      originalPaymentId,
      amount: Number(amount),
      reason,
      method,
    })

    if (!result.ok) {
      setError(result.error ?? 'Failed to process refund')
      setLoading(false)
      return
    }

    setMsg('Refund processed successfully.')
    setLoading(false)
    setTimeout(() => {
      reset()
      setOpen(false)
      router.refresh()
    }, 2000)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-5 text-sm font-semibold text-[var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent)]/10"
      >
        <RotateCcw className="h-4 w-4" />
        Process Refund
      </button>
    )
  }

  const methods: Array<{ id: RefundMethod; label: string; Icon: typeof Wallet }> = [
    { id: 'wallet', label: 'Wallet Credit', Icon: Wallet },
    { id: 'bank_transfer', label: 'Bank Transfer', Icon: Building2 },
    { id: 'original_method', label: 'Original Method', Icon: CreditCard },
  ]

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--accent)]/20 bg-[var(--accent)]/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/15">
            <RotateCcw className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div>
            <p className="font-semibold">Process Refund</p>
            <p className="text-xs text-[var(--muted-foreground)]">{bookingLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            reset()
            setOpen(false)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--accent)]/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4 p-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Refund Amount (AED)
          </label>
          <input
            type="number"
            min={1}
            max={depositAmount}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-[var(--ring)]"
            required
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Max deposit: AED {depositAmount.toLocaleString()}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Refund Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => {
              const Icon = m.Icon
              const active = method === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={[
                    'flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 text-xs font-semibold transition-all',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] shadow-md'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5" />
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Deposit return after inspection - no damages"
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            required
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {msg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-600">
            <Check className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{msg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              Confirm Refund
            </>
          )}
        </button>
      </form>
    </div>
  )
}