'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, supabase: null, user: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowed = ['super_admin', 'fleet_manager']
  if (!profile || !allowed.includes(profile.role)) {
    return { ok: false, supabase: null, user: null }
  }

  return { ok: true, supabase, user }
}

export async function createVehicle(data: {
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
}) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) return { ok: false, error: 'Access denied' }

  const { data: vehicle, error } = await check.supabase
    .from('vehicles')
    .insert({
      ...data,
      status: 'available',
    })
    .select('id')
    .single()

  if (error || !vehicle) {
    return { ok: false, error: error?.message ?? 'Failed to create vehicle' }
  }

  revalidatePath('/admin/fleet')
  return { ok: true, vehicleId: vehicle.id }
}

export async function updateVehicle(
  vehicleId: string,
  data: {
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
    status: string
  }
) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) return { ok: false, error: 'Access denied' }

  const { error } = await check.supabase
    .from('vehicles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/fleet')
  revalidatePath(`/admin/fleet/${vehicleId}`)
  return { ok: true }
}

export async function deleteVehicle(vehicleId: string) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) return { ok: false, error: 'Access denied' }

  const { error } = await check.supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/fleet')
  return { ok: true }
}

export async function updateVehicleStatus(
  vehicleId: string,
  status: 'available' | 'rented' | 'under_maintenance' | 'out_of_service'
) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) return { ok: false, error: 'Access denied' }

  const { error } = await check.supabase
    .from('vehicles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/fleet')
  return { ok: true }
}

export async function uploadVehicleImage(vehicleId: string, file: File) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase || !check.user) {
    return { ok: false, error: 'Access denied' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const fileName = `${vehicleId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`

  const { error } = await check.supabase.storage
    .from('vehicle-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) return { ok: false, error: error.message }

  const { error: dbError } = await check.supabase
    .from('vehicle_images')
    .insert({
      vehicle_id: vehicleId,
      storage_path: fileName,
      is_primary: false,
      sort_order: 0,
    })

  if (dbError) return { ok: false, error: dbError.message }

  revalidatePath(`/admin/fleet/${vehicleId}`)
  revalidatePath('/admin/fleet')

  return { ok: true, path: fileName }
}

export async function deleteVehicleImage(imageId: string, storagePath: string) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) return { ok: false, error: 'Access denied' }

  await check.supabase.storage.from('vehicle-images').remove([storagePath])

  const { error } = await check.supabase
    .from('vehicle_images')
    .delete()
    .eq('id', imageId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/fleet')
  return { ok: true }
}

export async function setPrimaryImage(imageId: string, vehicleId: string) {
  const check = await checkAdmin()
  if (!check.ok || !check.supabase) return { ok: false, error: 'Access denied' }

  await check.supabase
    .from('vehicle_images')
    .update({ is_primary: false })
    .eq('vehicle_id', vehicleId)

  const { error } = await check.supabase
    .from('vehicle_images')
    .update({ is_primary: true })
    .eq('id', imageId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/fleet/${vehicleId}`)
  return { ok: true }
}