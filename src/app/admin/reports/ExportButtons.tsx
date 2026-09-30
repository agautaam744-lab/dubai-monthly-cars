'use client'

import { Download } from 'lucide-react'
import type { BookingRow, PaymentRow } from '@/types/database'

function toCsv(rows: Array<object>) {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const esc = (v: unknown) =>
    `"${String(v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v).replace(/"/g, '""')}"`
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(','))].join('\n')
}

function download(name: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExportButtons({
  bookings,
  payments,
  perVehicle,
}: {
  bookings: BookingRow[]
  payments: PaymentRow[]
  perVehicle: Array<{ vehicle: string; plate: string; status: string; bookings: number; revenue: number }>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => download(`bookings-${Date.now()}.csv`, toCsv(bookings))}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold"
      >
        <Download className="h-4 w-4" /> Bookings CSV
      </button>
      <button
        type="button"
        onClick={() => download(`payments-${Date.now()}.csv`, toCsv(payments))}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold"
      >
        <Download className="h-4 w-4" /> Payments CSV
      </button>
      <button
        type="button"
        onClick={() => download(`revenue-per-vehicle-${Date.now()}.csv`, toCsv(perVehicle))}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold"
      >
        <Download className="h-4 w-4" /> Revenue/vehicle CSV
      </button>
    </div>
  )
}
