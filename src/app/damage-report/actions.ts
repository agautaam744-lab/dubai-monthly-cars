'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadDamagePhoto({
  bookingId,
  file,
}: {
  bookingId: string
  file: File
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const fileName = `${user.id}/${bookingId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from('damage-reports')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) return { ok: false, error: error.message }

  const { data: urlData } = supabase.storage
    .from('damage-reports')
    .getPublicUrl(fileName)

  return { ok: true, path: fileName, url: urlData.publicUrl }
}

export async function createDamageReport({
  bookingId,
  description,
  estimatedCost,
  photos,
}: {
  bookingId: string
  description: string
  estimatedCost: number | null
  photos: { path: string; url: string }[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: report, error: reportError } = await supabase
    .from('damage_reports')
    .insert({
      booking_id: bookingId,
      description: description.trim(),
      estimated_cost_aed: estimatedCost,
      charged_against_deposit: false,
      status: 'reported',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (reportError || !report) {
    return {
      ok: false,
      error: reportError?.message ?? 'Failed to create report',
    }
  }

  if (photos.length > 0) {
    const photoInserts = photos.map((p) => ({
      report_id: report.id,
      storage_path: p.path,
    }))

    const { error: photoError } = await supabase
      .from('damage_report_photos')
      .insert(photoInserts)

    if (photoError) {
      return { ok: false, error: photoError.message }
    }
  }

  revalidatePath('/damage-report')
  revalidatePath(`/damage-report/${report.id}`)
  revalidatePath('/bookings')

  return { ok: true, reportId: report.id }
}