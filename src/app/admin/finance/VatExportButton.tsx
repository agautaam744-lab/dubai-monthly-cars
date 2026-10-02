'use client'

import { useState } from 'react'
import { Download, Calendar, X } from 'lucide-react'

export default function VatExportButton() {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const setQuickRange = (months: number) => {
    const today = new Date()
    const start = new Date(today)
    start.setMonth(start.getMonth() - months)
    setFrom(start.toISOString().slice(0, 10))
    setTo(today.toISOString().slice(0, 10))
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    window.location.href = `/api/admin/vat-export?${params.toString()}`
    setTimeout(() => setOpen(false), 500)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-5 text-sm font-semibold text-[var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent)]/10"
      >
        <Download className="h-4 w-4" />
        Export VAT CSV
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--accent)]" />
          <p className="text-sm font-semibold">Export VAT Report</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--accent)]/10"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setQuickRange(3)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
        >
          Last 3 months
        </button>
        <button
          type="button"
          onClick={() => setQuickRange(6)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
        >
          Last 6 months
        </button>
        <button
          type="button"
          onClick={() => setQuickRange(12)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
        >
          Last 12 months
        </button>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            From
          </span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="min-h-[42px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            To
          </span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="min-h-[42px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleExport}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
      >
        <Download className="h-4 w-4" />
        Download CSV
      </button>

      <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
        Exports all paid invoices with VAT breakdown. Compatible with Excel and Google Sheets.
      </p>
    </div>
  )
}