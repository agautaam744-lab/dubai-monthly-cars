'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Loader2, Check, AlertCircle } from 'lucide-react'
import { assignVehicleToHub } from './hubActions'

type Hub = {
  id: string
  name: string
  area: string | null
  is_primary: boolean
}

export default function HubAssignment({
  vehicleId,
  currentHubId,
  hubs,
}: {
  vehicleId: string
  currentHubId: string | null
  hubs: Hub[]
}) {
  const router = useRouter()
  const [selectedHubId, setSelectedHubId] = useState(currentHubId ?? '')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setMsg('')
    setError('')

    const hubId = selectedHubId === '' ? null : selectedHubId
    const result = await assignVehicleToHub(vehicleId, hubId)

    if (!result.ok) {
      setError(result.error ?? 'Failed to update hub')
      setLoading(false)
      return
    }

    setMsg('Hub updated successfully')
    setLoading(false)
    router.refresh()
    setTimeout(() => setMsg(''), 3000)
  }

  const currentHub = hubs.find((h) => h.id === currentHubId)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
          <MapPin className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="font-serif text-lg tracking-tight">Hub Assignment</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {currentHub
              ? `Currently at ${currentHub.name}`
              : 'Not assigned to any hub'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Pickup Location
          </label>
          <select
            value={selectedHubId}
            onChange={(e) => setSelectedHubId(e.target.value)}
            disabled={loading}
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
          >
            <option value="">— Not assigned —</option>
            {hubs.map((hub) => (
              <option key={hub.id} value={hub.id}>
                {hub.name}
                {hub.area ? ` · ${hub.area}` : ''}
                {hub.is_primary ? ' (Primary)' : ''}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {msg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-600">
            <Check className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{msg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={loading || selectedHubId === (currentHubId ?? '')}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Hub
            </>
          )}
        </button>
      </div>
    </div>
  )
}