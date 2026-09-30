'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, DoorOpen, ArrowLeftRight, Check, Loader2 } from 'lucide-react'
import { extendBooking, terminateBooking, swapBookingVehicle, updateBookingStatus } from '../actions'

const STATUSES = ['pending_kyc', 'pending_agreement', 'pending_payment', 'active', 'completed', 'cancelled', 'terminated']

export default function BookingManager({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter()
  const [months, setMonths] = useState(1)
  const [vehicleId, setVehicleId] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')

  const run = async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(key)
    setMsg('')
    const res = await fn()
    setMsg(res.ok ? 'Done.' : (res.error ?? 'Failed.'))
    setBusy('')
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 lg:col-span-2">
      <h2 className="font-semibold">Manage Rental</h2>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Current status: {status.replace(/_/g, ' ')}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
          aria-label="Extension months"
        >
          {[1, 3, 6, 12].map((m) => (
            <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => run('extend', () => extendBooking(bookingId, months))}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy === 'extend' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
          Extend
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => { if (confirm('Terminate this rental?')) run('terminate', () => terminateBooking(bookingId)) }}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-500/40 px-4 text-sm font-semibold text-red-500 disabled:opacity-50"
        >
          {busy === 'terminate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <DoorOpen className="h-4 w-4" />}
          Terminate
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value.trim())}
          placeholder="Replacement vehicle ID"
          className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 font-mono text-xs"
        />
        <button
          type="button"
          disabled={!!busy || !vehicleId}
          onClick={() => run('swap', () => swapBookingVehicle(bookingId, vehicleId))}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold disabled:opacity-50"
        >
          {busy === 'swap' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
          Swap vehicle
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--muted-foreground)]">Set status:</span>
        {STATUSES.filter((s) => s !== status).map((s) => (
          <button
            key={s}
            type="button"
            disabled={!!busy}
            onClick={() => run(`st-${s}`, () => updateBookingStatus(bookingId, s))}
            className="rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-semibold capitalize disabled:opacity-50"
          >
            {busy === `st-${s}` ? '…' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {msg && (
        <p className="mt-3 flex items-center gap-1.5 text-xs">
          <Check className="h-3.5 w-3.5 text-green-500" />
          {msg}
        </p>
      )}
    </div>
  )
}
