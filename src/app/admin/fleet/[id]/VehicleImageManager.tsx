'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  Loader2,
  Trash2,
  Star,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react'
import {
  uploadVehicleImage,
  deleteVehicleImage,
  setPrimaryImage,
} from '../actions'

type VehicleImage = {
  id: string
  storage_path: string
  is_primary: boolean
  sort_order: number
}

export default function VehicleImageManager({
  vehicleId,
  images: initialImages,
}: {
  vehicleId: string
  images: VehicleImage[]
}) {
  const router = useRouter()
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    const results = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const result = await uploadVehicleImage(vehicleId, file)
      results.push(result)
    }

    const errors = results.filter((r) => !r.ok)
    if (errors.length > 0) {
      setError(errors[0].error ?? 'Some uploads failed')
    }

    setUploading(false)
    e.target.value = ''
    router.refresh()
  }

  const handleDelete = (imageId: string, storagePath: string) => {
    if (!confirm('Delete this photo?')) return

    setImages((prev) => prev.filter((img) => img.id !== imageId))
    startTransition(async () => {
      await deleteVehicleImage(imageId, storagePath)
      router.refresh()
    })
  }

  const handleSetPrimary = (imageId: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
    )
    startTransition(async () => {
      await setPrimaryImage(imageId, vehicleId)
      router.refresh()
    })
  }

  const getImageUrl = (path: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-images/${path}`
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-semibold">Vehicle Photos</h2>
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">
          {images.length} photo{images.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Upload Area */}
      <label
        className={[
          'flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition',
          uploading
            ? 'border-[var(--accent)] bg-[var(--accent)]/5'
            : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50',
        ].join(' ')}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
            <p className="text-sm text-[var(--muted-foreground)]">
              Uploading...
            </p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="text-sm font-medium">Click to upload photos</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              JPEG, PNG, WebP — multiple files allowed
            </p>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--border)]"
              >
                <img
                  src={getImageUrl(img.storage_path)}
                  alt="Vehicle"
                  className="h-full w-full object-cover"
                />

                {/* Primary badge */}
                {img.is_primary && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-foreground)]">
                    <Star className="h-3 w-3 fill-current" />
                    PRIMARY
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      disabled={isPending}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:bg-[var(--accent)] hover:text-white disabled:opacity-50"
                      title="Set as primary"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(img.id, img.storage_path)}
                    disabled={isPending}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
          No photos yet. Upload at least one photo to show customers.
        </p>
      )}
    </div>
  )
}