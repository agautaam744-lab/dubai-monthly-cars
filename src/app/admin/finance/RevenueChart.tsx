'use client'

import { TrendingUp } from 'lucide-react'

type DataPoint = {
  month: string
  value: number
}

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  function formatAED(value: number) {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-6 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="font-semibold">Revenue — Last 6 Months</h2>
      </div>

      <div className="flex h-64 items-end justify-between gap-3">
        {data.map((d, i) => {
          const heightPercent = (d.value / max) * 100
          return (
            <div key={i} className="group flex flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[var(--accent)]/60 to-[var(--accent)]"
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                />
                <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--foreground)] px-2 py-1 text-xs font-semibold text-[var(--background)] group-hover:block">
                  {formatAED(d.value)}
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                {d.month}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}