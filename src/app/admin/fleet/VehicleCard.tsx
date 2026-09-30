'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  Car,
  MapPin,
  Gauge,
  Fuel,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { deleteVehicle, updateVehicleStatus } from './actions'

export type Vehicle = {
  id: string
  make: string
  model: string
  year: number | null
  category: string | null
  transmission: string | null
  fuel_type: string | null
  seats: number | null
  color: string | null
  plate_number: string
  current_mileage: number
  status: string
  location: string | null
  vehicle_images: { id: string; storage_path: string; is_primary: boolean; sort_order: number }[]
  vehicle_pricing: { monthly_price_aed: number | string; pricing_tiers: { name: string; sort_order: number } | { name: string; sort_order: number }[] | null }[]
}

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

const statusConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  available: {
    label: 'Available',
    color: 'bg-green-500/10 text-green-600',
    icon: CheckCircle2,
  },
  rented: {
    label: 'Rented',
    color: 'bg-blue-500/10 text-blue-600',
    icon: Car,
  },
  under_maintenance: {
    label: 'Maintenance',
    color: 'bg-yellow-500/10 text-yellow-600',
    icon: Wrench,
  },
  out_of_service: {
    label: 'Out of Service',
    color: 'bg-red-500/10 text-red-600',
    icon: XCircle,
  },
}

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [isPending, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Get primary image or first
  const images = (vehicle.vehicle_images ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const primary = images.find((img) => img.is_primary) ?? images[0]

  const imageUrl = primary
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-images/${primary.storage_path}`
    : null

  // Get lowest price
  const pricing = (vehicle.vehicle_pricing ?? []).sort((a, b) => {
    const aSort = Array.isArray(a.pricing_tiers) ? a.pricing_tiers[0]?.sort_order : a.pricing_tiers?.sort_order
    const bSort = Array.isArray(b.pricing_tiers) ? b.pricing_tiers[0]?.sort_order : b.pricing_tiers?.sort_order
    return (aSort ?? 0) - (bSort ?? 0)
  })
  const lowestPrice = pricing[0]?.monthly_price_aed

  const status = statusConfig[vehicle.status] ?? statusConfig.available
  const StatusIcon = status.icon

  const handleStatusChange = (newStatus: string) => {
    setMenuOpen(false)
    startTransition(async () => {
      await updateVehicleStatus(
        vehicle.id,
        newStatus as 'available' | 'rented' | 'under_maintenance' | 'out_of_service'
      )
    })
  }

  const handleDelete = async () => {
    if (!confirm(`Delete ${vehicle.make} ${vehicle.model}? This cannot be undone.`)) {
      return
    }

    setDeleting(true)
    const result = await deleteVehicle(vehicle.id)
    if (!result.ok) {
      alert(result.error ?? 'Failed to delete')
      setDeleting(false)
    }
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--accent)]/50">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-[var(--muted)]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Car className="h-12 w-12 text-[var(--muted-foreground)]" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              status.color
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>

        {/* Menu button */}
        <div className="absolute right-3 top-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
          >
            {deleting || isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
                <Link
                  href={`/admin/fleet/${vehicle.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-[var(--muted)]"
                  onClick={() => setMenuOpen(false)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit vehicle
                </Link>

                <div className="border-t border-[var(--border)] px-4 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Change status
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStatusChange('available')}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition hover:bg-[var(--muted)]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Available
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('rented')}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition hover:bg-[var(--muted)]"
                >
                  <Car className="h-3.5 w-3.5 text-blue-500" />
                  Rented
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('under_maintenance')}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition hover:bg-[var(--muted)]"
                >
                  <Wrench className="h-3.5 w-3.5 text-yellow-500" />
                  Maintenance
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('out_of_service')}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition hover:bg-[var(--muted)]"
                >
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  Out of Service
                </button>

                <div className="border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete vehicle
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
              {vehicle.plate_number}
            </p>
          </div>

          {lowestPrice && (
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-[var(--accent)]">
                {formatAED(Number(lowestPrice))}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">/month</p>
            </div>
          )}
        </div>

        {/* Specs */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
            <Gauge className="h-3 w-3" />
            <span>{vehicle.current_mileage.toLocaleString()} km</span>
          </div>

          {vehicle.fuel_type && (
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <Fuel className="h-3 w-3" />
              <span>{vehicle.fuel_type}</span>
            </div>
          )}

          {vehicle.seats && (
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <Users className="h-3 w-3" />
              <span>{vehicle.seats} seats</span>
            </div>
          )}

          {vehicle.location && (
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{vehicle.location}</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <Link
          href={`/admin/fleet/${vehicle.id}`}
          className="mt-4 flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs font-semibold transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
        >
          View & Manage
        </Link>
      </div>
    </div>
  )
}