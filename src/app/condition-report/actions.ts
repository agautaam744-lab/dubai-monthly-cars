'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createConditionReport({
  bookingId,
  type,
  mileage,
  fuelLevel,
  notes,
  photos,
}: {
  bookingId: string
  type: 'pickup' | 'return'
  mileage: number
  fuelLevel: string
  notes: string
  photos: { path: string; url: string }[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: report, error: reportError } = await supabase
    .from('condition_reports')
    .insert({
      booking_id: bookingId,
      type,
      mileage,
      fuel_level: fuelLevel,
      notes: notes.trim() || null,
      reported_by: user.id,
    })
    .select('id')
    .single()

  if (reportError || !report) {
    return { ok: false, error: reportError?.message ?? 'Failed to create report' }
  }

  if (photos.length > 0) {
    const photoInserts = photos.map((p) => ({
      report_id: report.id,
      storage_path: p.path,
    }))

    const { error: photoError } = await supabase
      .from('condition_report_photos')
      .insert(photoInserts)

    if (photoError) {
      return { ok: false, error: photoError.message }
    }
  }

  revalidatePath('/condition-report')
  revalidatePath(`/condition-report/${bookingId}`)
  revalidatePath('/bookings')

  return { ok: true, reportId: report.id }
}

export async function uploadConditionPhoto({
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
    .from('condition-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) return { ok: false, error: error.message }

  const { data: signedData, error: signedUrlError } = await supabase.storage
    .from('condition-photos')
    .createSignedUrl(fileName, 3600)

  if (signedUrlError || !signedData?.signedUrl) {
    return {
      ok: false,
      error: signedUrlError?.message ?? 'Failed to create secure photo URL',
    }
  }

  return { ok: true, path: fileName, url: signedData.signedUrl }
}