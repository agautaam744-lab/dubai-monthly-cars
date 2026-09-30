'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleCorporateStatus } from './actions'

export default function CorporateActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const next = status === 'active' ? 'suspended' : 'active'

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleCorporateStatus(id, next)
          router.refresh()
        })
      }
      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
    >
      {isPending ? '…' : next === 'active' ? 'Reactivate' : 'Suspend'}
    </button>
  )
}
