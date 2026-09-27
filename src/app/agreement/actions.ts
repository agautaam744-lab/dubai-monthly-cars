'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function signAgreement({
  bookingId,
  signatureDataUrl,
}: {
  bookingId: string
  signatureDataUrl: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not logged in' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, customer_id, agreement_signed_at')
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .single()

  if (!booking) return { ok: false, error: 'Booking not found' }

  if (booking.agreement_signed_at) {
    return { ok: false, error: 'Agreement already signed' }
  }

  // Convert base64 to Uint8Array
  const base64Data = signatureDataUrl.split(',')[1]
  const binaryString = Buffer.from(base64Data, 'base64')
  const uint8Array = new Uint8Array(binaryString)

  const fileName = `${user.id}/${bookingId}-signature-${Date.now()}.png`

  const { error: uploadError } = await supabase.storage
    .from('agreements')
    .upload(fileName, uint8Array, {
      contentType: 'image/png',
      upsert: false,
    })

  if (uploadError) {
    return { ok: false, error: uploadError.message }
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      agreement_signed_at: now,
      agreement_pdf_path: fileName,
      updated_at: now,
    })
    .eq('id', bookingId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath(`/agreement/${bookingId}`)

  return { ok: true, signedAt: now }
}