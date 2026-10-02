'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Power, Trash2, Loader2 } from 'lucide-react'
import { toggleHubActive, deleteHub } from './actions'

export default function HubActions({
  hubId,
  isActive,
  hubName,
}: {
  hubId: string
  isActive: boolean
  hubName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleToggle = () => {
    startTransition(async () => {
      await toggleHubActive(hubId, !isActive)
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    startTransition(async () => {
      await deleteHub(hubId)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50 ${
          isActive
            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10'
            : 'border-gray-500/30 bg-gray-500/5 text-gray-600 hover:bg-gray-500/10'
        }`}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Power className="h-3 w-3" />
        )}
        {isActive ? 'Active' : 'Inactive'}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50 ${
          confirmDelete
            ? 'border-red-500 bg-red-500 text-white'
            : 'border-red-500/30 bg-red-500/5 text-red-600 hover:bg-red-500/10'
        }`}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
        {confirmDelete ? 'Confirm?' : 'Delete'}
      </button>
    </div>
  )
}