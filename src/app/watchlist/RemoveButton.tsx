'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2 } from 'lucide-react'
import { removeFromWatchlist } from './actions'

export default function RemoveButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticGone, setOptimisticGone] = useState(false)

  const handleRemove = () => {
    setOptimisticGone(true)
    startTransition(async () => {
      await removeFromWatchlist(vehicleId)
      router.refresh()
    })
  }

  if (optimisticGone) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
        <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      aria-label="Remove from watchlist"
      title="Remove from watchlist"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:scale-110 hover:border-red-500/50 hover:bg-red-500/80 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
    </button>
  )
}