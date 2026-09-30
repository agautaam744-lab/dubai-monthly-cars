'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CheckCircle2, XCircle, Clock, RotateCcw, DollarSign, RefreshCw, type LucideIcon } from 'lucide-react'
import { refundPayment, retryFailedPayment } from './actions'
import type { PaymentRow } from '@/types/database'

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(value)
}

const statusConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  succeeded: { label: 'Succeeded', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-600', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-blue-500/10 text-blue-600', icon: RotateCcw },
}

export default function TransactionTable({ payments }: { payments: PaymentRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const customer = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
      return p.id.toLowerCase().includes(q) || customer?.email?.toLowerCase().includes(q) || (p.type ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const handleRefund = async (id: string) => {
    if (!confirm('Process refund?')) return
    await refundPayment(id)
    router.refresh()
  }

  const handleRetry = async (id: string) => {
    if (!confirm('Retry this failed billing?')) return
    await retryFailedPayment(id)
    router.refresh()
  }

  const tabs = [
    { v: 'all', l: 'All', c: payments.length },
    { v: 'succeeded', l: 'Succeeded', c: payments.filter((p) => p.status === 'succeeded').length },
    { v: 'pending', l: 'Pending', c: payments.filter((p) => p.status === 'pending').length },
    { v: 'failed', l: 'Failed', c: payments.filter((p) => p.status === 'failed').length },
    { v: 'refunded', l: 'Refunded', c: payments.filter((p) => p.status === 'refunded').length },
  ]

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-semibold">Transactions</h2>
          <span className="ml-auto text-xs text-[var(--muted-foreground)]">{filtered.length} of {payments.length}</span>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, email..."
            className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setStatusFilter(t.v)}
              className={`inline-flex min-h-[36px] items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-xs font-medium ${statusFilter === t.v ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border)]'}`}
            >
              {t.l}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusFilter === t.v ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'bg-[var(--muted)]'}`}>{t.c}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--muted-foreground)]">No transactions found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--muted)]/30">
              <tr className="text-xs uppercase text-[var(--muted-foreground)]">
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((p) => {
                const customer = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
                const config = statusConfig[p.status] ?? statusConfig.pending
                const Icon = config.icon
                return (
                  <tr key={p.id} className="hover:bg-[var(--muted)]/20">
                    <td className="px-5 py-4">
                      <p className="font-medium">{customer?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{customer?.email ?? ''}</p>
                    </td>
                    <td className="px-5 py-4 capitalize">{(p.type ?? 'payment').replace('_', ' ')}</td>
                    <td className="px-5 py-4 font-semibold">{formatAED(Number(p.amount_aed))}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
                        <Icon className="h-3 w-3" /> {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--muted-foreground)]">
                      {p.paid_at || p.created_at
                        ? new Date((p.paid_at || p.created_at) as string).toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {p.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => handleRetry(p.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-500/30 px-3 py-1.5 text-xs font-semibold text-yellow-600 hover:bg-yellow-500/10"
                          >
                            <RefreshCw className="h-3 w-3" /> Retry
                          </button>
                        )}
                        {p.status === 'succeeded' && (
                          <button
                            type="button"
                            onClick={() => handleRefund(p.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10"
                          >
                            <RotateCcw className="h-3 w-3" /> Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}