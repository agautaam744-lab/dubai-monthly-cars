import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import VehicleForm from '../VehicleForm'

export default async function AddVehiclePage() {
  await requireAdmin()

  return (
    <div className="p-6 sm:p-8">
      {/* Back link */}
      <Link
        href="/admin/fleet"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Fleet
      </Link>

      {/* Header */}
      <div className="mt-6 mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Fleet Management
        </p>
        <h1 className="mt-2 text-3xl font-bold">Add New Vehicle</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Fill in the vehicle details to add it to your fleet.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <VehicleForm mode="create" />
      </div>
    </div>
  )
}