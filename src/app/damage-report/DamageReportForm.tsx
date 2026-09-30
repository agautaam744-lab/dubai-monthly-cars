'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera,
  Loader2,
  X,
  Check,
  Upload,
  AlertCircle,
  FileText,
  DollarSign,
} from 'lucide-react'
import { createDamageReport, uploadDamagePhoto } from './actions'

type Photo = {
  path: string
  url: string
  preview: string
}

type Props = {
  bookingId: string
  vehicleName: string
}

export default function DamageReportForm({ bookingId, vehicleName }: Props) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
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

      const result = await uploadDamagePhoto({ bookingId, file })

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

    if (!description.trim()) {
      setError('Please describe the damage')
      return
    }

    if (photos.length === 0) {
      setError('Please upload at least one photo of the damage')
      return
    }

    setSubmitting(true)
    setError('')

    const result = await createDamageReport({
      bookingId,
      description,
      estimatedCost: estimatedCost ? Number(estimatedCost) : null,
      photos: photos.map((p) => ({ path: p.path, url: p.url })),
    })

    if (!result.ok) {
      setError(result.error ?? 'Failed to submit report')
      setSubmitting(false)
      return
    }

    router.push(`/damage-report/${result.reportId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="rounded-xl bg-[var(--muted)]/50 px-3 py-2 text-xs font-medium text-[var(--muted-foreground)]">
        Vehicle: {vehicleName}
      </p>
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-[var(--accent)]" />
          Damage Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe the damage in detail. What happened? Where is the damage located?"
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          required
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <DollarSign className="h-4 w-4 text-[var(--accent)]" />
          Estimated Repair Cost (AED, optional)
        </label>
        <input
          type="number"
          value={estimatedCost}
          onChange={(e) => setEstimatedCost(e.target.value)}
          placeholder="e.g. 500"
          min="0"
          className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Leave blank if you don&apos;t know. Our team will assess it.
        </p>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4 text-[var(--accent)]" />
          Damage Photos (min 1 required)
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
            Submit Damage Report
          </>
        )}
      </button>
    </form>
  )
}