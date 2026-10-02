import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import VehicleForm from '../VehicleForm'
import VehicleImageManager from './VehicleImageManager'
import HubAssignment from '../HubAssignment'

type Props = {
  params: Promise<{ id: string }>
}

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params
  const { supabase } = await requireAdmin()

  const [{ data: vehicle, error }, { data: hubs }] = await Promise.all([
    supabase
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        category,
        transmission,
        fuel_type,
        seats,
        color,
        plate_number,
        hub_id,
        current_mileage,
        status,
        location,
        description,
        vehicle_images ( id, storage_path, is_primary, sort_order )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('hubs')
      .select('id, name, area, is_primary')
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('name'),
  ])

  if (error || !vehicle) notFound()

  return (
    <div className="p-6 sm:p-8">
      <Link
        href="/admin/fleet"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Fleet
      </Link>

      <div className="mt-6 mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Fleet Management
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {vehicle.make} {vehicle.model}
        </h1>
        <p className="mt-2 font-mono text-sm text-[var(--muted-foreground)]">
          {vehicle.plate_number}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <VehicleForm
            mode="edit"
            initialData={{
              id: vehicle.id,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year ?? new Date().getFullYear(),
              category: vehicle.category ?? 'Economy',
              transmission: vehicle.transmission ?? 'Automatic',
              fuel_type: vehicle.fuel_type ?? 'Petrol',
              seats: vehicle.seats ?? 5,
              color: vehicle.color ?? '',
              plate_number: vehicle.plate_number,
              current_mileage: vehicle.current_mileage,
              location: vehicle.location ?? 'Dubai Marina',
              description: vehicle.description ?? '',
              status: vehicle.status,
            }}
          />
        </div>

        <div className="h-fit space-y-6 lg:sticky lg:top-24">
          <HubAssignment
            vehicleId={vehicle.id}
            currentHubId={vehicle.hub_id ?? null}
            hubs={hubs ?? []}
          />
          <VehicleImageManager
            vehicleId={vehicle.id}
            images={vehicle.vehicle_images ?? []}
          />
        </div>
      </div>
    </div>
  )
}