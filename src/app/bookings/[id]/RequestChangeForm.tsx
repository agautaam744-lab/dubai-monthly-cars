'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarClock,
  XCircle,
  Car,
  Loader2,
  AlertCircle,
  Check,
  Send,
} from 'lucide-react'
import { createChangeRequest } from './changeActions'

type ChangeType = 'extension' | 'termination' | 'swap'

export default function RequestChangeForm({
  bookingId,
  currentEndDate,
  currentDuration,
  currentVehicleId,
  availableVehicles,
}: {
  bookingId: string
  currentEndDate: string | null
  currentDuration: number
  currentVehicleId: string
  availableVehicles: Array<{ id: string; make: string; model: string }>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [changeType, setChangeType] = useState<ChangeType>('extension')
  const [reason, setReason] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [newVehicleId, setNewVehicleId] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const reset = () => {
    setChangeType('extension')
    setReason('')
    setNewEndDate('')
    setNewDuration('')
    setNewVehicleId('')
    setMsg('')
    setError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a reason')
      return
    }

    const metadata: Record<string, unknown> = {}
    if (changeType === 'extension') {
      if (!newEndDate) {
        setError('Please select a new end date')
        return
      }
      metadata.new_end_date = newEndDate
      metadata.new_duration_months = Number(newDuration) || undefined
    }
    if (changeType === 'swap') {
      if (!newVehicleId) {
        setError('Please choose a new vehicle')
        return
      }
      metadata.new_vehicle_id = newVehicleId
    }

    setLoading(true)
    setError('')
    setMsg('')

    const result = await createChangeRequest({
      bookingId,
      changeType,
      reason,
      metadata,
    })

    if (!result.ok) {
      setError(result.error ?? 'Failed to submit request')
      setLoading(false)
      return
    }

    setMsg('Request submitted. Our team will review it shortly.')
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
        className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-6 text-sm font-semibold text-[var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent)]/10"
      >
        <CalendarClock className="h-4 w-4" />
        Request Extension / Termination / Swap
      </button>
    )
  }

  const typeButtons = [
    { id: 'extension' as const, label: 'Extension', Icon: CalendarClock, color: 'text-sky-600 border-sky-500/30 bg-sky-500/5' },
    { id: 'termination' as const, label: 'Terminate', Icon: XCircle, color: 'text-red-600 border-red-500/30 bg-red-500/5' },
    { id: 'swap' as const, label: 'Vehicle Swap', Icon: Car, color: 'text-amber-600 border-amber-500/30 bg-amber-500/5' },
  ]

  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <CalendarClock className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="font-serif text-lg tracking-tight">Request a change</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Extension, termination, or vehicle swap
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            reset()
            setOpen(false)
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
          aria-label="Close"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5 p-5">
        <div className="grid grid-cols-3 gap-2">
          {typeButtons.map((t) => {
            const Icon = t.Icon
            const active = changeType === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setChangeType(t.id)}
                className={[
                  'flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 text-xs font-semibold transition-all',
                  active
                    ? t.color + ' shadow-md'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40',
                ].join(' ')}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {changeType === 'extension' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                New end date
              </span>
              <input
                type="date"
                value={newEndDate}
                min={currentEndDate ?? new Date().toISOString().slice(0, 10)}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Extra months (optional)
              </span>
              <input
                type="number"
                min={1}
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="e.g. 2"
                className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
          </div>
        )}

        {changeType === 'swap' && (
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              New vehicle
            </span>
            <select
              value={newVehicleId}
              onChange={(e) => setNewVehicleId(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">Select a vehicle...</option>
              {availableVehicles
                .filter((v) => v.id !== currentVehicleId)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model}
                  </option>
                ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Reason
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Why do you want this change?"
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </label>

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
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Request
            </>
          )}
        </button>
      </form>
    </div>
  )
}