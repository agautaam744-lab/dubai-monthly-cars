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
  Sparkles,
  Image as ImageIcon,
  ShieldAlert,
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

  const labelClass =
    'mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Vehicle banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 via-transparent to-transparent p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
          <ShieldAlert className="h-5 w-5 text-red-600" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-red-600">
            Reporting damage on
          </p>
          <p className="mt-0.5 truncate font-serif text-base tracking-tight">
            {vehicleName}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>
          <FileText className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          Damage Description
          <span className="ms-auto text-[10px] normal-case tracking-normal text-[var(--muted-foreground)]">
            {description.length} chars
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Describe the damage in detail. What happened? Where is the damage located?"
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm leading-6 outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]"
          required
        />
      </div>

      {/* Estimated cost */}
      <div>
        <label className={labelClass}>
          <DollarSign className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          Estimated Repair Cost
          <span className="ms-auto text-[10px] normal-case tracking-normal text-[var(--muted-foreground)]">
            Optional
          </span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--muted-foreground)]">
            AED
          </span>
          <input
            type="number"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            placeholder="e.g. 500"
            min="0"
            className="min-h-[56px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] ps-14 pe-4 text-base font-semibold tabular-nums outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
          Leave blank if you don&rsquo;t know. Our team will assess it.
        </p>
      </div>

      {/* Photos */}
      <div>
        <label className={labelClass}>
          <Camera className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          Damage Photos
          <span className="ms-auto text-[10px] text-[var(--muted-foreground)]">
            {photos.length} uploaded · min 1 required
          </span>
        </label>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.path}
              className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--border)] shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.preview}
                alt="Upload"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              <button
                type="button"
                onClick={() => removePhoto(p.path)}
                aria-label="Remove photo"
                className="absolute end-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}

          <label
            className={[
              'group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-all',
              uploading
                ? 'cursor-wait border-[var(--accent)]/40 bg-[var(--accent)]/5'
                : 'border-[var(--border)] bg-[var(--card)] hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:bg-[var(--accent)]/5',
            ].join(' ')}
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" aria-hidden="true" />
                <span className="text-[10px] font-semibold text-[var(--accent)]">
                  Uploading...
                </span>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 transition-transform group-hover:scale-110">
                  <Upload className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-semibold text-[var(--muted-foreground)] group-hover:text-[var(--accent)]">
                  Add Photo
                </span>
                <ImageIcon className="h-3 w-3 text-[var(--muted-foreground)]" aria-hidden="true" />
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

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || uploading}
        className="group flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl hover:shadow-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Submitting...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Submit Damage Report
          </>
        )}
      </button>

      <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        <p className="text-xs leading-5 text-[var(--muted-foreground)]">
          Reports go directly to our fleet team. We review condition reports at pickup and return before applying any charges against your deposit.
        </p>
      </div>
    </form>
  )
}