'use client'

import { useState, useTransition } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { removeFromWatchlist } from './actions'

export default function RemoveButton({ vehicleId }: { vehicleId: string }) {
  const [isPending, startTransition] = useTransition()
  const [removed, setRemoved] = useState(false)

  const handleRemove = () => {
    setRemoved(true)
    startTransition(async () => {
      await removeFromWatchlist(vehicleId)
    })
  }

  if (removed) return null

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      aria-label="Remove from watchlist"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
      )}
    </button>
  )
}