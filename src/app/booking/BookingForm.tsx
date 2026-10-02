'use client'

import {
  CalendarDays,
  Check,
  ChevronRight,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
  Truck,
  Car,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkCustomerKyc, createBookingFromSelection } from './actions'

type PricingRow = {
  id: string
  monthly_price_aed: number | string
  security_deposit_aed: number | string
  pricing_tiers:
    | {
        id: string
        name: string
        description: string | null
        mileage_limit_km: number
        insurance_level: string | null
        includes_delivery: boolean | null
        sort_order: number | null
      }
    | null
}

type AddOn = {
  id: string
  name: string
  description: string | null
  price_aed: number | string
  price_type: 'one_time' | 'monthly'
}

type Vehicle = {
  id: string
  make: string
  model: string
  year: number | null
  category: string | null
  location: string | null
  description: string | null
}

type Props = {
  vehicle: Vehicle
  pricing: PricingRow[]
  initialTierId: string
  addOns: AddOn[]
  initialStartDate: string
}

const durations = [1, 3, 6, 12]

export const DURATION_DISCOUNTS: Record<number, number> = {
  1: 0,
  3: 0.05,
  6: 0.1,
  12: 0.15,
}

export function getDiscountRate(months: number) {
  return DURATION_DISCOUNTS[months] ?? 0
}

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

const STEP_LABELS = ['Plan', 'Duration', 'Date', 'Delivery', 'Add-ons']

export function BookingForm({
  vehicle,
  pricing,
  initialTierId,
  addOns,
  initialStartDate,
}: Props) {
  const [selectedTierId, setSelectedTierId] = useState(initialTierId)
  const [duration, setDuration] = useState(1)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'home_delivery'>('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])

  const homeDeliveryAddOn = addOns.find((item) => {
    const name = item.name.trim().toLowerCase()
    return name === 'home delivery (dubai)' || name === 'home delivery'
  })

  const visibleAddOns = addOns.filter((item) =>
    homeDeliveryAddOn ? item.id !== homeDeliveryAddOn.id : true
  )

  const [saved, setSaved] = useState(false)
  const [kycMessage, setKycMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()

  const selectedPricing = useMemo(() => {
    return (
      pricing.find((item) => item.pricing_tiers?.id === selectedTierId) ?? pricing[0]
    )
  }, [pricing, selectedTierId])

  const monthlyPrice = Number(selectedPricing?.monthly_price_aed ?? 0)
  const deposit = Number(selectedPricing?.security_deposit_aed ?? 0)

  const homeDeliveryIncluded =
    selectedPricing?.pricing_tiers?.includes_delivery === true

  const homeDeliveryFee =
    deliveryType === 'home_delivery' && !homeDeliveryIncluded
      ? Number(homeDeliveryAddOn?.price_aed ?? 0)
      : 0

  const monthlyAddOns = addOns.filter(
    (item) => item.price_type === 'monthly' && selectedAddOns.includes(item.id)
  )

  const oneTimeAddOns = addOns.filter(
    (item) => item.price_type === 'one_time' && selectedAddOns.includes(item.id)
  )

  const monthlyAddOnTotal = monthlyAddOns.reduce(
    (total, item) => total + Number(item.price_aed),
    0
  )

  const oneTimeAddOnTotal = oneTimeAddOns.reduce(
    (total, item) => total + Number(item.price_aed),
    0
  )

  const effectiveOneTimeAddOnTotal = oneTimeAddOnTotal + homeDeliveryFee

  const discountRate = DURATION_DISCOUNTS[duration] ?? 0
  const discountedMonthlyPrice = Math.round(monthlyPrice * (1 - discountRate))
  const discountedMonthlyAddOnTotal = Math.round(monthlyAddOnTotal * (1 - discountRate))
  const monthlyRentalTotal = discountedMonthlyPrice + discountedMonthlyAddOnTotal

  const estimatedFirstPayment =
    monthlyRentalTotal + effectiveOneTimeAddOnTotal + deposit

  const toggleAddOn = (id: string) => {
    setSaved(false)
    setSelectedAddOns((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  const saveBookingSelection = async () => {
    setKycMessage('')
    const todayUtc = new Date().toISOString().slice(0, 10)

    if (!startDate) {
      setSaved(false)
      setKycMessage('Please select a start date before continuing.')
      return
    }

    if (startDate < todayUtc) {
      setKycMessage('Start date cannot be in the past. Please select a valid future date.')
      return
    }

    if (deliveryType === 'home_delivery' && !deliveryAddress.trim()) {
      setSaved(false)
      return
    }

    if (!selectedPricing?.pricing_tiers?.id) {
      setKycMessage('Please select a valid pricing plan before continuing.')
      return
    }

    setSubmitting(true)
    setSaved(false)

    try {
      const kyc = await checkCustomerKyc()

      if (!kyc.ok) {
        setKycMessage(
          'KYC verification is required. Please get Emirates ID, Driving License and Passport approved before continuing.'
        )

        const next = window.location.pathname + window.location.search
        setSubmitting(false)
        router.push(`/kyc?next=${encodeURIComponent(next)}`)
        return
      }

      const draft = {
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.make} ${vehicle.model}`,
        tierId: selectedPricing.pricing_tiers.id,
        tierName: selectedPricing.pricing_tiers.name,
        durationMonths: duration,
        startDate,
        deliveryType,
        deliveryAddress: deliveryType === 'home_delivery' ? deliveryAddress.trim() : '',
        addOnIds: selectedAddOns,
        monthlyPrice,
        deposit,
        monthlyAddOnTotal,
        oneTimeAddOnTotal: effectiveOneTimeAddOnTotal,
        estimatedFirstPayment,
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem(
        'dubai-monthly-cars-booking-draft',
        JSON.stringify(draft)
      )

      const result = await createBookingFromSelection({
        vehicleId: vehicle.id,
        tierId: selectedPricing.pricing_tiers.id,
        durationMonths: duration,
        startDate,
        deliveryType,
        deliveryAddress: deliveryType === 'home_delivery' ? deliveryAddress.trim() : '',
        addOnIds: selectedAddOns,
      })

      localStorage.removeItem('dubai-monthly-cars-booking-draft')

      setSaved(true)
      router.push(`/bookings?created=${result.bookingId}`)
    } catch (error) {
      setSaved(false)
      setKycMessage(
        error instanceof Error
          ? error.message
          : 'Booking could not be created. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Reserve your car
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            Complete your booking
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            Configure your monthly plan in a few steps. You will only be charged after KYC approval and agreement signing.
          </p>

          {/* Step indicator */}
          <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3 sm:gap-x-5">
            {STEP_LABELS.map((label, idx) => (
              <li key={label} className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[11px] font-bold text-[var(--accent)]">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]/70">
                  {label}
                </span>
                {idx < STEP_LABELS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden h-px w-6 bg-[var(--border)] sm:inline-block"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* MAIN */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:px-8 lg:py-14">
        {/* LEFT */}
        <div className="space-y-10">
          {/* Vehicle */}
          <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <Car className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                    Vehicle
                  </p>
                  <h2 className="mt-1.5 font-serif text-2xl tracking-tight">
                    {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {vehicle.year ?? ''}
                    {vehicle.category ? ` · ${vehicle.category}` : ''}
                    {vehicle.location ? ` · ${vehicle.location}` : ''}
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-semibold text-[var(--accent)] sm:block">
                Monthly
              </div>
            </div>
          </div>

          {/* Step 1 — Plan */}
          <section>
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Step 1
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight">
                Choose your plan
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Compare mileage, insurance and delivery benefits.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {pricing.map((item) => {
                const tier = item.pricing_tiers
                if (!tier) return null
                const selected = tier.id === selectedTierId

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedTierId(tier.id)
                      setSaved(false)
                    }}
                    className={[
                      'group relative rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                      selected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md shadow-[var(--accent)]/10'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50 hover:shadow-md',
                    ].join(' ')}
                  >
                    {selected && (
                      <span className="absolute end-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}

                    <h3 className="font-serif text-xl tracking-tight">
                      {tier.name}
                    </h3>

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold tabular-nums tracking-tight text-[var(--accent)]">
                        {formatAED(Number(item.monthly_price_aed))}
                      </span>
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">
                        /mo
                      </span>
                    </div>

                    <div className="mt-4 space-y-2.5 border-t border-[var(--border)] pt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{tier.mileage_limit_km.toLocaleString()} km / mo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="truncate">
                          {tier.insurance_level || 'Insurance included'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="truncate">
                          {tier.includes_delivery ? 'Delivery included' : 'Pickup option'}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Step 2 — Duration */}
          <section>
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Step 2
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight">
                Rental duration
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Longer commitments unlock bigger discounts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {durations.map((months) => {
                const active = duration === months
                const savePercent = months === 3 ? 5 : months === 6 ? 10 : months === 12 ? 15 : 0

                return (
                  <button
                    key={months}
                    type="button"
                    onClick={() => {
                      setDuration(months)
                      setSaved(false)
                    }}
                    className={[
                      'group relative min-h-[96px] rounded-2xl border px-4 py-4 text-center transition-all hover:-translate-y-0.5',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md shadow-[var(--accent)]/10'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50 hover:shadow-md',
                    ].join(' ')}
                  >
                    <span className="block font-serif text-3xl tracking-tight">
                      {months}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                      {months === 1 ? 'Month' : 'Months'}
                    </span>
                    {savePercent > 0 && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        Save {savePercent}%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 p-3 text-xs leading-5 text-[var(--muted-foreground)]">
              {discountRate > 0
                ? `${Math.round(discountRate * 100)}% multi-month discount applied to monthly rent and monthly add-ons.`
                : 'Choose 3, 6 or 12 months to unlock 5%, 10% or 15% off monthly rent.'}
            </p>
          </section>

          {/* Step 3 — Start date */}
          <section>
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Step 3
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight">
                Start date
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                When should your rental begin?
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Pickup or delivery date
              </span>
              <div className="flex min-h-[54px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 transition focus-within:border-[var(--accent)]/60 focus-within:ring-2 focus-within:ring-[var(--ring)]">
                <CalendarDays className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value)
                    setSaved(false)
                  }}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-transparent text-sm outline-none [&::-webkit-calendar-picker-indicator]:opacity-60"
                  required
                />
              </div>
            </label>
          </section>

          {/* Step 4 — Delivery */}
          <section>
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Step 4
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight">
                Delivery or pickup
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Pickup from a hub or home delivery across Dubai.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setDeliveryType('pickup')
                  setSaved(false)
                }}
                className={[
                  'rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5',
                  deliveryType === 'pickup'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md shadow-[var(--accent)]/10'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50 hover:shadow-md',
                ].join(' ')}
              >
                <MapPin className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">Pick up the car</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Collect your vehicle from the selected Dubai location.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeliveryType('home_delivery')
                  setSaved(false)
                }}
                className={[
                  'rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5',
                  deliveryType === 'home_delivery'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md shadow-[var(--accent)]/10'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50 hover:shadow-md',
                ].join(' ')}
              >
                <Home className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">Home delivery</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Have the vehicle delivered to your Dubai address.
                </p>
              </button>
            </div>

            {deliveryType === 'home_delivery' && (
              <div className="mt-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Delivery address
                  </span>
                  <textarea
                    value={deliveryAddress}
                    onChange={(event) => {
                      setDeliveryAddress(event.target.value)
                      setSaved(false)
                    }}
                    rows={3}
                    placeholder="Enter your Dubai delivery address"
                    className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </label>
              </div>
            )}
          </section>

          {/* Step 5 — Add-ons */}
          <section>
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Step 5
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight">
                Optional add-ons
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Add extra services to your monthly rental.
              </p>
            </div>

            {addOns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/50 p-5 text-sm text-[var(--muted-foreground)]">
                No optional add-ons are available yet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleAddOns.map((addOn) => {
                  const selected = selectedAddOns.includes(addOn.id)

                  return (
                    <button
                      key={addOn.id}
                      type="button"
                      onClick={() => toggleAddOn(addOn.id)}
                      className={[
                        'group flex min-h-[110px] items-start gap-4 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5',
                        selected
                          ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md shadow-[var(--accent)]/10'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50 hover:shadow-md',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition',
                          selected
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                            : 'border-[var(--border)]',
                        ].join(' ')}
                      >
                        {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold">{addOn.name}</h3>
                            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                              {addOn.description || 'Optional rental service'}
                            </p>
                          </div>
                          <span className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums text-[var(--accent)]">
                            {formatAED(Number(addOn.price_aed))}
                            {addOn.price_type === 'monthly' ? '/mo' : ''}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Save / Submit */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            {saved && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700">
                <Check className="h-4 w-4" aria-hidden="true" />
                Booking selection saved successfully.
              </div>
            )}

            {kycMessage && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
                <p className="font-semibold">Action required</p>
                <p className="mt-1 leading-5">{kycMessage}</p>
                <p className="mt-2 text-xs font-medium">
                  Please try selecting a different start date, or go back and choose another vehicle.
                </p>
              </div>
            )}

            {!startDate && (
              <p className="mb-4 text-sm text-amber-600">
                Please select a start date before continuing.
              </p>
            )}

            {deliveryType === 'home_delivery' && !deliveryAddress.trim() && (
              <p className="mb-4 text-sm text-amber-600">
                Please enter your delivery address.
              </p>
            )}

            <button
              type="button"
              onClick={saveBookingSelection}
              disabled={
                submitting ||
                !startDate ||
                (deliveryType === 'home_delivery' && !deliveryAddress.trim())
              }
              className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl hover:shadow-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {submitting ? 'Creating booking...' : 'Continue with this selection'}
              {!submitting && (
                <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
              )}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-[var(--muted-foreground)]">
              Your selection will be saved temporarily. Login, KYC, agreement and payment will be connected in the next booking steps.
            </p>
          </div>
        </div>

        {/* RIGHT — SUMMARY */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
            <div className="relative bg-gradient-to-br from-[var(--primary)] to-black p-5 text-white">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(201,162,39,0.25),transparent)]"
              />
              <div className="relative flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                <h2 className="font-serif text-lg tracking-tight">
                  Booking Summary
                </h2>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Vehicle
                </p>
                <p className="mt-1 font-semibold">
                  {vehicle.make} {vehicle.model}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                    Plan
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedPricing?.pricing_tiers?.name}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                    Duration
                  </p>
                  <p className="mt-1 font-semibold">
                    {duration} {duration === 1 ? 'month' : 'months'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Delivery
                </p>
                <p className="mt-1 font-semibold">
                  {deliveryType === 'pickup' ? 'Pickup from hub' : 'Home delivery'}
                </p>
                {deliveryType === 'home_delivery' && (
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {homeDeliveryIncluded
                      ? 'Included with plan'
                      : homeDeliveryFee > 0
                        ? `Fee: ${formatAED(homeDeliveryFee)}`
                        : 'Fee configured at checkout'}
                  </p>
                )}
              </div>

              <div className="border-t border-[var(--border)] pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Monthly rental</span>
                  <span className="font-medium tabular-nums">{formatAED(monthlyPrice)}</span>
                </div>

                {monthlyAddOnTotal > 0 && (
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Monthly add-ons</span>
                    <span className="font-medium tabular-nums">{formatAED(monthlyAddOnTotal)}</span>
                  </div>
                )}

                {oneTimeAddOnTotal > 0 && (
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">One-time add-ons</span>
                    <span className="font-medium tabular-nums">{formatAED(oneTimeAddOnTotal)}</span>
                  </div>
                )}

                {discountRate > 0 && (
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-emerald-600">Multi-month discount</span>
                    <span className="font-medium tabular-nums text-emerald-600">
                      -{Math.round(discountRate * 100)}%
                    </span>
                  </div>
                )}

                <div className="mt-4 border-t border-dashed border-[var(--border)] pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">
                      Security deposit (Refundable)
                    </span>
                    <span className="font-medium tabular-nums">{formatAED(deposit)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                      Estimated first payment
                    </p>
                    <p className="mt-1 font-serif text-3xl tracking-tight tabular-nums text-[var(--accent)]">
                      {formatAED(estimatedFirstPayment)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <p className="text-xs leading-5 text-[var(--foreground)]/70">
                  Your final booking will be confirmed only after KYC approval, agreement acceptance and successful payment.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}