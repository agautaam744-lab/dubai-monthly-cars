'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, X, MapPin, AlertCircle, Check } from 'lucide-react'
import { createHub } from './actions'

export default function HubForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMsg('')

    const formData = new FormData(e.currentTarget)
    const result = await createHub(formData)

    if (!result.ok) {
      setError(result.error ?? 'Failed to create hub')
      setLoading(false)
      return
    }

    setMsg('Hub created successfully')
    setLoading(false)
    ;(e.target as HTMLFormElement).reset()
    setTimeout(() => {
      setOpen(false)
      setMsg('')
      router.refresh()
    }, 1500)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
      >
        <Plus className="h-4 w-4" />
        Add New Hub
      </button>
    )
  }

  const inputClass =
    'min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]'

  return (
    <div className="rounded-3xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-transparent p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <MapPin className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="font-serif text-xl tracking-tight">New Hub</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              RTA-registered pickup location
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Hub Name *
            </label>
            <input
              name="name"
              placeholder="e.g. JBR Hub"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Area
            </label>
            <input
              name="area"
              placeholder="e.g. Jumeirah Beach Residence"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Full Address *
          </label>
          <input
            name="address"
            placeholder="Building, street, area, Dubai"
            className={inputClass}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Phone
            </label>
            <input
              name="phone"
              placeholder="+971 4 000 0000"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Opening Hours
            </label>
            <input
              name="opening_hours"
              placeholder="9:00 AM - 9:00 PM"
              defaultValue="9:00 AM - 9:00 PM"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Parking info, access instructions..."
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
          <input
            type="checkbox"
            name="is_primary"
            className="h-4 w-4 rounded accent-[var(--accent)]"
          />
          <span className="text-sm font-medium">
            Mark as primary hub
          </span>
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
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Hub
            </>
          )}
        </button>
      </form>
    </div>
  )
}