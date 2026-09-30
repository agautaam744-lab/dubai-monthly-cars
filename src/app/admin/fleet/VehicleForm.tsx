'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Save,
  AlertCircle,
  Car,
  Fuel,
  Users,
  Palette,
  MapPin,
  Gauge,
  Hash,
  Calendar,
  Settings2,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react'
import { createVehicle, updateVehicle, uploadVehicleImage } from './actions'

type VehicleData = {
  id?: string
  make: string
  model: string
  year: number
  category: string
  transmission: string
  fuel_type: string
  seats: number
  color: string
  plate_number: string
  current_mileage: number
  location: string
  description: string
  status?: string
}

type Props = {
  initialData?: VehicleData
  mode: 'create' | 'edit'
}

const categories = ['Economy', 'Sedan', 'SUV', 'Luxury', 'Electric', 'Sports']
const transmissions = ['Automatic', 'Manual']
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric']
const statuses = ['available', 'rented', 'under_maintenance', 'out_of_service']

export default function VehicleForm({ initialData, mode }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  const [form, setForm] = useState<VehicleData>(
    initialData ?? {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      category: 'Economy',
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      seats: 5,
      color: '',
      plate_number: '',
      current_mileage: 0,
      location: 'Dubai Marina',
      description: '',
      status: 'available',
    }
  )

  const update = (field: keyof VehicleData, value: VehicleData[keyof VehicleData]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles: File[] = []
    const newPreviews: string[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is larger than 5MB`)
        continue
      }
      newFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }

    setPendingPhotos((prev) => [...prev, ...newFiles])
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
    e.target.value = ''
  }

  const removePendingPhoto = (index: number) => {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.make.trim() || !form.model.trim()) {
      setError('Make and Model are required')
      return
    }
    if (!form.plate_number.trim()) {
      setError('Plate number is required')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      let vehicleId: string

      if (mode === 'create') {
        const result = await createVehicle({
          make: form.make.trim(),
          model: form.model.trim(),
          year: Number(form.year),
          category: form.category,
          transmission: form.transmission,
          fuel_type: form.fuel_type,
          seats: Number(form.seats),
          color: form.color.trim(),
          plate_number: form.plate_number.trim().toUpperCase(),
          current_mileage: Number(form.current_mileage),
          location: form.location.trim(),
          description: form.description.trim(),
        })

        if (!result.ok) {
          setError(result.error ?? 'Failed to create vehicle')
          setSubmitting(false)
          return
        }

        vehicleId = result.vehicleId
      } else {
        if (!form.id) {
          setError('Vehicle ID missing')
          setSubmitting(false)
          return
        }

        const result = await updateVehicle(form.id, {
          make: form.make.trim(),
          model: form.model.trim(),
          year: Number(form.year),
          category: form.category,
          transmission: form.transmission,
          fuel_type: form.fuel_type,
          seats: Number(form.seats),
          color: form.color.trim(),
          plate_number: form.plate_number.trim().toUpperCase(),
          current_mileage: Number(form.current_mileage),
          location: form.location.trim(),
          description: form.description.trim(),
          status: form.status ?? 'available',
        })

        if (!result.ok) {
          setError(result.error ?? 'Failed to update vehicle')
          setSubmitting(false)
          return
        }

        vehicleId = form.id
      }

      // Upload pending photos (only in create mode)
      if (mode === 'create' && pendingPhotos.length > 0) {
        for (const file of pendingPhotos) {
          const uploadResult = await uploadVehicleImage(vehicleId, file)
          if (!uploadResult.ok) {
            console.error('Photo upload failed:', uploadResult.error)
          }
        }
      }

      setSubmitting(false)

      if (mode === 'create') {
        router.push(`/admin/fleet/${vehicleId}`)
        router.refresh()
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 font-semibold">
          <Car className="h-5 w-5 text-[var(--accent)]" />
          Basic Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Make <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.make}
              onChange={(e) => update('make', e.target.value)}
              placeholder="e.g. Toyota, Mercedes"
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              placeholder="e.g. Camry, C-Class"
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              required
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-[var(--accent)]" />
              Year
            </label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => update('year', e.target.value)}
              min="1990"
              max="2100"
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Hash className="h-4 w-4 text-[var(--accent)]" />
              Plate Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.plate_number}
              onChange={(e) => update('plate_number', e.target.value)}
              placeholder="e.g. DXB-A-12345"
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm uppercase outline-none focus:ring-2 focus:ring-[var(--ring)]"
              required
            />
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 font-semibold">
          <Settings2 className="h-5 w-5 text-[var(--accent)]" />
          Specifications
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Transmission</label>
            <select
              value={form.transmission}
              onChange={(e) => update('transmission', e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {transmissions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Fuel className="h-4 w-4 text-[var(--accent)]" />
              Fuel Type
            </label>
            <select
              value={form.fuel_type}
              onChange={(e) => update('fuel_type', e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {fuelTypes.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-[var(--accent)]" />
              Seats
            </label>
            <input
              type="number"
              value={form.seats}
              onChange={(e) => update('seats', e.target.value)}
              min="2"
              max="12"
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Palette className="h-4 w-4 text-[var(--accent)]" />
              Color
            </label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
              placeholder="e.g. White, Black"
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Gauge className="h-4 w-4 text-[var(--accent)]" />
              Current Mileage (km)
            </label>
            <input
              type="number"
              value={form.current_mileage}
              onChange={(e) => update('current_mileage', e.target.value)}
              min="0"
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-[var(--accent)]" />
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Dubai Marina, JLT, Downtown"
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          {mode === 'edit' && (
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium">Status</label>
              <select
                value={form.status ?? 'available'}
                onChange={(e) => update('status', e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* PHOTOS (only in create mode) */}
      {mode === 'create' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <h2 className="mb-5 flex items-center gap-2 font-semibold">
            <ImageIcon className="h-5 w-5 text-[var(--accent)]" />
            Vehicle Photos (Optional)
          </h2>

          <label className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] transition hover:border-[var(--accent)]/50">
            <Upload className="h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="text-sm font-medium">Click to upload photos</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              JPEG, PNG, WebP — Max 5MB each
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </label>

          {photoPreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photoPreviews.map((preview, index) => (
                <div
                  key={index}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--border)]"
                >
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePendingPhoto(index)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            First photo will be the primary image. Photos will be uploaded
            automatically when you click &quot;Create Vehicle&quot;.
          </p>
        </div>
      )}

      {/* Description */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="mb-2 block text-sm font-medium">
          Description (optional)
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          placeholder="Any additional details about this vehicle..."
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-[48px] rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 text-sm font-semibold transition hover:bg-[var(--muted)]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === 'create' && pendingPhotos.length > 0
                ? 'Creating & uploading...'
                : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {mode === 'create' ? 'Create Vehicle' : 'Save Changes'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}