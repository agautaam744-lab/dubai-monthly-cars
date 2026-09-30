'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const REQUIRED_DOCUMENTS = [
  'emirates_id',
  'driving_license',
  'passport',
] as const

const TERMINAL_BOOKING_STATUSES = new Set([
  'cancelled',
  'completed',
  'terminated',
])

const DURATION_DISCOUNTS: Record<number, number> = {
  1: 0,
  3: 0.05,
  6: 0.1,
  12: 0.15,
}

export async function checkCustomerKyc() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false as const,
      reason: 'UNAUTHENTICATED' as const,
      missing: [...REQUIRED_DOCUMENTS],
    }
  }

  const { data, error } = await supabase
    .from('documents')
    .select('type, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const latestByType = new Map<string, string>()

  for (const row of data ?? []) {
    if (!latestByType.has(row.type)) {
      latestByType.set(row.type, row.status)
    }
  }

  const missing = REQUIRED_DOCUMENTS.filter(
    (type) => latestByType.get(type) !== 'approved'
  )

  if (missing.length > 0) {
    return {
      ok: false as const,
      reason: 'KYC_REQUIRED' as const,
      missing,
    }
  }

  return {
    ok: true as const,
    missing: [],
  }
}

type CreateBookingInput = {
  vehicleId: string
  tierId: string
  durationMonths: number
  startDate: string
  deliveryType: 'pickup' | 'home_delivery'
  deliveryAddress: string
  addOnIds: string[]
}

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function addMonthsMinusOneDay(
  startDate: string,
  months: number,
) {
  const [year, month, day] = startDate
    .split('-')
    .map(Number)

  const end = new Date(
    Date.UTC(year, month - 1 + months, day),
  )

  end.setUTCDate(end.getUTCDate() - 1)

  return end.toISOString().slice(0, 10)
}

function startOfTodayUTC() {
  return new Date().toISOString().slice(0, 10)
}

export async function createBookingFromSelection(
  input: CreateBookingInput,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Please login before creating a booking.')
  }

  const durationMonths = Number(input.durationMonths)

  if (![1, 3, 6, 12].includes(durationMonths)) {
    throw new Error('Invalid rental duration.')
  }

  if (!isValidDateString(input.startDate)) {
    throw new Error('Invalid start date.')
  }

  if (input.startDate < startOfTodayUTC()) {
    throw new Error('Start date cannot be in the past.')
  }

  if (!['pickup', 'home_delivery'].includes(input.deliveryType)) {
    throw new Error('Invalid delivery type.')
  }

  if (
    input.deliveryType === 'home_delivery' &&
    !input.deliveryAddress.trim()
  ) {
    throw new Error(
      'Please enter your home delivery address.',
    )
  }

  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('id, is_blacklisted')
      .eq('id', user.id)
      .single()

  if (profileError || !profile) {
    throw new Error('Customer profile could not be found.')
  }

  if (profile.is_blacklisted) {
    throw new Error(
      'Your account is currently restricted from making new bookings.',
    )
  }

  // Server-side KYC recheck. Never trust the client-side gate alone.
  const kyc = await checkCustomerKyc()

  if (!kyc.ok) {
    throw new Error(
      'KYC approval is required before creating a booking.',
    )
  }

  const { data: vehicle, error: vehicleError } =
    await supabase
      .from('vehicles')
      .select('id, status')
      .eq('id', input.vehicleId)
      .single()

  if (vehicleError || !vehicle) {
    throw new Error('Vehicle not found.')
  }

  if (vehicle.status !== 'available') {
    throw new Error(
      'This vehicle is not currently available for booking.',
    )
  }

  const { data: pricing, error: pricingError } =
    await supabase
      .from('vehicle_pricing')
      .select('id, vehicle_id, tier_id, monthly_price_aed, security_deposit_aed')
      .eq('vehicle_id', input.vehicleId)
      .eq('tier_id', input.tierId)
      .maybeSingle()

  if (pricingError || !pricing) {
    throw new Error(
      'The selected pricing plan is not available for this vehicle.',
    )
  }

  const endDate = addMonthsMinusOneDay(
    input.startDate,
    durationMonths,
  )

  // Re-check overlapping non-terminal bookings on the server.
  const { data: existingBookings, error: bookingCheckError } =
    await supabase
      .from('bookings')
      .select('id, start_date, end_date, status')
      .eq('vehicle_id', input.vehicleId)

  if (bookingCheckError) {
    throw new Error(bookingCheckError.message)
  }

  const hasConflict = (existingBookings ?? []).some(
    (booking) => {
      if (TERMINAL_BOOKING_STATUSES.has(String(booking.status))) {
        return false
      }

      const existingStart = String(booking.start_date)
      const existingEnd = booking.end_date
        ? String(booking.end_date)
        : existingStart

      return (
        existingStart <= endDate &&
        existingEnd >= input.startDate
      )
    },
  )

  if (hasConflict) {
    throw new Error(
      'This vehicle is already booked for part of the selected period.',
    )
  }

  const uniqueAddOnIds = [
    ...new Set(input.addOnIds),
  ]

  let selectedAddOns: Array<{
    id: string
    name: string
    price_aed: number
    price_type: 'one_time' | 'monthly'
  }> = []

  if (uniqueAddOnIds.length > 0) {
    const { data: addOns, error: addOnError } =
      await supabase
        .from('add_ons')
        .select('id, name, price_aed, price_type, is_active')
        .in('id', uniqueAddOnIds)

    if (addOnError) {
      throw new Error(addOnError.message)
    }

    selectedAddOns = (addOns ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      price_aed: Number(item.price_aed),
      price_type: item.price_type as 'one_time' | 'monthly',
    }))

    if (selectedAddOns.length !== uniqueAddOnIds.length) {
      throw new Error('One or more selected add-ons are invalid.')
    }

    if ((addOns ?? []).some((item) => !item.is_active)) {
      throw new Error(
        'One or more selected add-ons are no longer available.',
      )
    }
  }

  const { data: tier, error: tierError } =
    await supabase
      .from('pricing_tiers')
      .select('id, includes_delivery')
      .eq('id', input.tierId)
      .single()

  if (tierError || !tier) {
    throw new Error('Pricing plan could not be found.')
  }

  const homeDeliveryAddOn =
    selectedAddOns.find((item) => {
      const name = item.name.trim().toLowerCase()
      return (
        name === 'home delivery (dubai)' ||
        name === 'home delivery'
      )
    })

  const monthlyAddOnTotal = selectedAddOns
    .filter((item) => item.price_type === 'monthly')
    .reduce((sum, item) => sum + item.price_aed, 0)

  let oneTimeAddOnTotal = selectedAddOns
    .filter((item) => item.price_type === 'one_time')
    .reduce((sum, item) => sum + item.price_aed, 0)

  if (
    input.deliveryType === 'home_delivery' &&
    !tier.includes_delivery &&
    !homeDeliveryAddOn
  ) {
    const { data: deliveryAddOn } = await supabase
      .from('add_ons')
      .select('id, name, price_aed, price_type, is_active')
      .eq('is_active', true)
      .or('name.ilike.Home Delivery (Dubai),name.ilike.Home Delivery')
      .limit(1)
      .maybeSingle()

    if (deliveryAddOn) {
      const fee = Number(deliveryAddOn.price_aed)
      const feeType = deliveryAddOn.price_type as 'one_time' | 'monthly'
      selectedAddOns.push({
        id: deliveryAddOn.id,
        name: deliveryAddOn.name,
        price_aed: fee,
        price_type: feeType,
      })

      if (feeType === 'monthly') {
        // monthly fee also gets the duration discount below
      } else {
        oneTimeAddOnTotal += fee
      }
    }
  }

  const discountRate = DURATION_DISCOUNTS[durationMonths] ?? 0
  const discountedMonthlyPrice = Math.round(Number(pricing.monthly_price_aed) * (1 - discountRate))
  // Recompute monthly add-on total with discount if a monthly delivery fee was auto-added
  const autoMonthlyDelivery = selectedAddOns
    .filter((item) => item.price_type === 'monthly')
    .reduce((sum, item) => sum + item.price_aed, 0)
  const finalMonthlyAddOnTotal = Math.round(autoMonthlyDelivery * (1 - discountRate))

  const totalAddOns =
    finalMonthlyAddOnTotal + oneTimeAddOnTotal

  const { data: booking, error: bookingError } =
    await supabase
      .from('bookings')
      .insert({
        customer_id: user.id,
        vehicle_id: input.vehicleId,
        tier_id: input.tierId,
        start_date: input.startDate,
        end_date: endDate,
        duration_months: durationMonths,
        monthly_price_aed: discountedMonthlyPrice,
        deposit_aed: Number(pricing.security_deposit_aed),
        total_add_ons_aed: totalAddOns,
        delivery_type: input.deliveryType,
        delivery_address:
          input.deliveryType === 'home_delivery'
            ? input.deliveryAddress.trim()
            : null,
      })
      .select('id')
      .single()

  if (bookingError || !booking) {
    throw new Error(
      bookingError?.message ?? 'Booking could not be created.',
    )
  }

  if (selectedAddOns.length > 0) {
    const bookingAddOns = selectedAddOns.map((item) => ({
      booking_id: booking.id,
      add_on_id: item.id,
      quantity: 1,
      price_aed: item.price_aed,
    }))

    const { error: bookingAddOnError } =
      await supabase
        .from('booking_add_ons')
        .insert(bookingAddOns)

    if (bookingAddOnError) {
      await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id)

      throw new Error(bookingAddOnError.message)
    }
  }

  revalidatePath('/bookings')
  revalidatePath('/dashboard')

  return {
    ok: true as const,
    bookingId: booking.id,
  }
}
