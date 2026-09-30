import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PaymentForm from './PaymentForm'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>
}) {
  const params = await searchParams
  const bookingId = params.booking

  if (!bookingId) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/payments?booking=${bookingId}`)
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      start_date,
      duration_months,
      delivery_type,
      delivery_address,
      monthly_price_aed,
      deposit_aed,
      total_add_ons_aed,
      vehicles (
        id,
        make,
        model,
        year,
        category,
        location
      ),
      pricing_tiers (
        id,
        name
      )
    `)
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .single()

  if (error || !booking) {
    notFound()
  }

  const { data: addOnRows } = await supabase
    .from('booking_add_ons')
    .select(`
      id,
      quantity,
      price_aed,
      add_ons ( name, price_type )
    `)
    .eq('booking_id', bookingId)

  const addOns = (addOnRows ?? []).map((row: { id: string; quantity?: number | null; price_aed?: number | string | null; add_ons?: { name: string; price_type: string } | { name: string; price_type: string }[] | null }) => ({
    id: row.id,
    quantity: Number(row.quantity ?? 0),
    price_aed: row.price_aed ?? 0,
    add_ons: row.add_ons ?? null,
  }))

  return <PaymentForm booking={booking} addOns={addOns} />
}