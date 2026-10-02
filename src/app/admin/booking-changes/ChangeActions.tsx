'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, AlertCircle } from 'lucide-react'
import { approveChange, rejectChange } from './actions'

export function ChangeActions({
  changeId,
  changeType,
}: {
  changeId: string
  changeType: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [error, setError] = useState('')

  const handleApprove = () => {
    setError('')
    startTransition(async () => {
      const result = await approveChange(changeId, changeType)
      if (!result.ok) {
        setError(result.error ?? 'Failed to approve')
        return
      }
      router.refresh()
    })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Please enter a reason for rejection')
      return
    }
    setError('')
    startTransition(async () => {
      const result = await rejectChange(changeId, rejectionReason)
      if (!result.ok) {
        setError(result.error ?? 'Failed to reject')
        return
      }
      setShowReject(false)
      setRejectionReason('')
      router.refresh()
    })
  }

  if (showReject) {
    return (
      <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
            Rejection Reason
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={2}
            placeholder="Why is this request being rejected?"
            className="mt-1.5 w-full resize-none rounded-lg border border-red-500/30 bg-[var(--background)] p-3 text-sm outline-none focus:ring-2 focus:ring-red-500/40"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs text-red-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReject}
            disabled={isPending}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-red-500 px-4 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Confirm Reject
          </button>
          <button
            type="button"
            onClick={() => {
              setShowReject(false)
              setRejectionReason('')
              setError('')
            }}
            disabled={isPending}
            className="inline-flex min-h-[40px] items-center rounded-lg border border-[var(--border)] px-4 text-xs font-semibold transition hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve
        </button>
        <button
          type="button"
          onClick={() => setShowReject(true)}
          disabled={isPending}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-5 text-sm font-semibold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-500/10 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Reject
        </button>
      </div>
    </div>
  )
}