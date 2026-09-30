'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { completeMaintenance } from './actions'

export default function CompleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await completeMaintenance(id)
        router.refresh()
      })}
      className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-600 disabled:opacity-50"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {isPending ? '…' : 'Mark completed'}
    </button>
  )
}
