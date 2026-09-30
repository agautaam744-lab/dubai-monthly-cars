'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera,
  Loader2,
  X,
  Check,
  Upload,
  Fuel,
  Gauge,
  AlertCircle,
} from 'lucide-react'
import {
  createConditionReport,
  uploadConditionPhoto,
} from './actions'

type Photo = {
  path: string
  url: string
  preview: string
}

type Props = {
  bookingId: string
  type: 'pickup' | 'return'
  vehicleName: string
}

export default function ConditionReportForm({
  bookingId,
  type,
  vehicleName,
}: Props) {
  const router = useRouter()
  const [mileage, setMileage] = useState('')
  const [fuelLevel, setFuelLevel] = useState('Full')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    const newPhotos: Photo[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      const result = await uploadConditionPhoto({ bookingId, file })

      if (result.ok && result.path && result.url) {
        newPhotos.push({
          path: result.path,
          url: result.url,
          preview: URL.createObjectURL(file),
        })
      } else {
        setError(result.error ?? 'Upload failed')
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos])
    setUploading(false)
    e.target.value = ''
  }

  const removePhoto = (path: string) => {
    setPhotos((prev) => prev.filter((p) => p.path !== path))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mileage.trim()) {
      setError('Please enter the current mileage')
      return
    }

    if (photos.length === 0) {
      setError('Please upload at least one photo')
      return
    }

    setSubmitting(true)
    setError('')

    const result = await createConditionReport({
      bookingId,
      type,
      mileage: Number(mileage),
      fuelLevel,
      notes,
      photos: photos.map((p) => ({ path: p.path, url: p.url })),
    })

    if (!result.ok) {
      setError(result.error ?? 'Failed to submit report')
      setSubmitting(false)
      return
    }

    router.push(`/condition-report/${bookingId}`)
  }

  const fuelOptions = ['Empty', '1/4', '1/2', '3/4', 'Full']

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="rounded-xl bg-[var(--muted)]/50 px-3 py-2 text-xs font-medium text-[var(--muted-foreground)]">
        Vehicle: {vehicleName}
      </p>
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Gauge className="h-4 w-4 text-[var(--accent)]" />
          Current Mileage (km)
        </label>
        <input
          type="number"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          placeholder="e.g. 45230"
          min="0"
          className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          required
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Fuel className="h-4 w-4 text-[var(--accent)]" />
          Fuel Level
        </label>
        <div className="grid grid-cols-5 gap-2">
          {fuelOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFuelLevel(opt)}
              className={[
                'min-h-[48px] rounded-xl border px-2 text-xs font-semibold transition',
                fuelLevel === opt
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] ring-1 ring-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
              ].join(' ')}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4 text-[var(--accent)]" />
          Photos (min 1 required)
        </label>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.path}
              className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--border)]"
            >
              <img
                src={p.preview}
                alt="Upload"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(p.path)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <label
            className={[
              'flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition',
              uploading
                ? 'border-[var(--muted)] bg-[var(--muted)]'
                : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
            ].join(' ')}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-[var(--muted-foreground)]" />
                <span className="mt-1.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                  Add Photo
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Additional Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any existing scratches, dents or issues..."
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Submit {type === 'pickup' ? 'Pickup' : 'Return'} Report
          </>
        )}
      </button>
    </form>
  )
}