'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleWatchlist(vehicleId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Not logged in', added: false }
  }

  const { data: existing } = await supabase
    .from('watchlist')
    .select('id')
    .eq('user_id', user.id)
    .eq('vehicle_id', vehicleId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', existing.id)

    if (error) return { ok: false, error: error.message, added: false }

    revalidatePath('/watchlist')
    revalidatePath('/cars')
    revalidatePath(`/cars/${vehicleId}`)
    return { ok: true, added: false }
  }

  const { error } = await supabase
    .from('watchlist')
    .insert({ user_id: user.id, vehicle_id: vehicleId })

  if (error) return { ok: false, error: error.message, added: false }

  revalidatePath('/watchlist')
  revalidatePath('/cars')
  revalidatePath(`/cars/${vehicleId}`)
  return { ok: true, added: true }
}

export async function removeFromWatchlist(vehicleId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false }

  await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('vehicle_id', vehicleId)

  revalidatePath('/watchlist')
  return { ok: true }
}