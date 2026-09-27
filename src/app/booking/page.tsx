import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingForm } from "./BookingForm";
type BookingPageProps = {
  searchParams: Promise<{
    vehicle?: string
    tier?: string
  }>
}

type NormalizedPricingRow = {
  id: string
  monthly_price_aed: number | string
  security_deposit_aed: number | string
  pricing_tiers: {
    id: string
    name: string
    description: string | null
    mileage_limit_km: number
    insurance_level: string | null
    includes_delivery: boolean | null
    sort_order: number | null
  } | null
}

export default async function BookingPage({
  searchParams,
}: BookingPageProps) {
  const params = await searchParams

  const vehicleId = params.vehicle
  const tierId = params.tier ?? ''

  if (!vehicleId) {
    notFound()
  }

  const supabase = await createClient()

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select(`
      id,
      make,
      model,
      year,
      category,
      location,
      description
    `)
    .eq('id', vehicleId)
    .eq('status', 'available')
    .single()

  if (vehicleError || !vehicle) {
    notFound()
  }

  const { data: rawPricing, error: pricingError } = await supabase
    .from('vehicle_pricing')
    .select(`
      id,
      monthly_price_aed,
      security_deposit_aed,
      pricing_tiers (
        id,
        name,
        description,
        mileage_limit_km,
        insurance_level,
        includes_delivery,
        sort_order
      )
    `)
    .eq('vehicle_id', vehicleId)

  if (pricingError) {
    throw new Error(pricingError.message)
  }

  const pricing: NormalizedPricingRow[] = (rawPricing ?? []).map((row) => {
    const tierValue = row.pricing_tiers

    return {
      id: String(row.id),
      monthly_price_aed: row.monthly_price_aed,
      security_deposit_aed: row.security_deposit_aed,
      pricing_tiers: Array.isArray(tierValue)
        ? (tierValue[0] ?? null)
        : tierValue,
    }
  })

  const { data: addOns, error: addOnError } = await supabase
    .from('add_ons')
    .select(`
      id,
      name,
      description,
      price_aed,
      price_type
    `)
    .eq('is_active', true)
    .order('name')

  if (addOnError) {
    throw new Error(addOnError.message)
  }

  const initialStartDate = new Date().toISOString().slice(0, 10)

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <BookingForm
        vehicle={vehicle}
        pricing={pricing}
        initialTierId={tierId}
        addOns={addOns ?? []}
        initialStartDate={initialStartDate}
      />
    </main>
  )
}
