'use client'

import { Crown } from 'lucide-react'

type Customer = {
  name: string
  email: string
  total: number
  count: number
}

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function TopCustomers({ customers }: { customers: Customer[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-6 flex items-center gap-2">
        <Crown className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="font-semibold">Top Customers</h2>
      </div>

      {customers.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
          No customer data yet
        </p>
      ) : (
        <div className="space-y-3">
          {customers.map((c, i) => (
            <div
              key={c.email}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                }`}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-[var(--muted-foreground)]">
                  {c.email} · {c.count} payment{c.count > 1 ? 's' : ''}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold">{formatAED(c.total)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}