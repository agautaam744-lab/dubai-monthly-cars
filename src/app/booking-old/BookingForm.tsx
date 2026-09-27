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

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function BookingForm({
  vehicle,
  pricing,
  initialTierId,
  addOns,
  initialStartDate,
}: Props) {
  const [selectedTierId, setSelectedTierId] =
    useState(initialTierId)

  const [duration, setDuration] = useState(1)

  const [startDate, setStartDate] =
    useState(initialStartDate)

  const [deliveryType, setDeliveryType] = useState<
    'pickup' | 'home_delivery'
  >('pickup')

  const [deliveryAddress, setDeliveryAddress] =
    useState('')

  const [selectedAddOns, setSelectedAddOns] =
    useState<string[]>([])

  const homeDeliveryAddOn = addOns.find((item) => {
    const name = item.name.trim().toLowerCase()
    return (
      name === 'home delivery (dubai)' ||
      name === 'home delivery'
    )
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
      pricing.find(
        (item) =>
          item.pricing_tiers?.id === selectedTierId
      ) ?? pricing[0]
    )
  }, [pricing, selectedTierId])

  const monthlyPrice = Number(
    selectedPricing?.monthly_price_aed ?? 0
  )

  const deposit = Number(
    selectedPricing?.security_deposit_aed ?? 0
  )

  const homeDeliveryIncluded =
    selectedPricing?.pricing_tiers?.includes_delivery === true

  const homeDeliveryFee =
    deliveryType === 'home_delivery' && !homeDeliveryIncluded
      ? Number(homeDeliveryAddOn?.price_aed ?? 0)
      : 0

  const monthlyAddOns = addOns.filter(
    (item) =>
      item.price_type === 'monthly' &&
      selectedAddOns.includes(item.id)
  )

  const oneTimeAddOns = addOns.filter(
    (item) =>
      item.price_type === 'one_time' &&
      selectedAddOns.includes(item.id)
  )

  const monthlyAddOnTotal = monthlyAddOns.reduce(
    (total, item) =>
      total + Number(item.price_aed),
    0
  )

  const oneTimeAddOnTotal = oneTimeAddOns.reduce(
    (total, item) =>
      total + Number(item.price_aed),
    0
  )

  const effectiveOneTimeAddOnTotal =
    oneTimeAddOnTotal + homeDeliveryFee

  const monthlyRentalTotal =
    monthlyPrice + monthlyAddOnTotal

  const estimatedFirstPayment =
    monthlyRentalTotal +
    effectiveOneTimeAddOnTotal +
    deposit

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

    if (!startDate) {
      setSaved(false)
      return
    }

    if (
      deliveryType === 'home_delivery' &&
      !deliveryAddress.trim()
    ) {
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

        const next =
          window.location.pathname + window.location.search

        window.location.href =
          `/kyc?next=${encodeURIComponent(next)}`

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
        deliveryAddress:
          deliveryType === 'home_delivery'
            ? deliveryAddress.trim()
            : '',
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
        deliveryAddress:
          deliveryType === 'home_delivery'
            ? deliveryAddress.trim()
            : '',
        addOnIds: selectedAddOns,
      })

      localStorage.removeItem(
        'dubai-monthly-cars-booking-draft'
      )

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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* =====================================================
          LEFT
      ====================================================== */}

      <div className="space-y-8">
        {/* Vehicle */}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                Vehicle
              </p>

              <h2 className="mt-2 text-xl font-bold">
                {vehicle.make} {vehicle.model}
              </h2>

              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {vehicle.year ?? ''}
                {vehicle.category
                  ? ` · ${vehicle.category}`
                  : ''}
                {vehicle.location
                  ? ` · ${vehicle.location}`
                  : ''}
              </p>
            </div>

            <div className="rounded-xl bg-[var(--accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--accent)]">
              Monthly Rental
            </div>
          </div>
        </div>

        {/* Plan */}

        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
              Step 1
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Choose your plan
            </h2>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Compare mileage, insurance and delivery
              benefits before continuing.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pricing.map((item) => {
              const tier = item.pricing_tiers
              if (!tier) return null

              const selected =
                tier.id === selectedTierId

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedTierId(tier.id)
                    setSaved(false)
                  }}
                  className={[
                    'relative rounded-2xl border p-5 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md'
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
                  ].join(' ')}
                >
                  {selected && (
                    <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                      <Check className="h-4 w-4" />
                    </span>
                  )}

                  <h3 className="text-lg font-bold">
                    {tier.name}
                  </h3>

                  <p className="mt-1 text-lg font-bold text-[var(--accent)]">
                    {formatAED(
                      Number(item.monthly_price_aed)
                    )}
                  </p>

                  <p className="text-xs text-[var(--muted-foreground)]">
                    per month
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[var(--success)]" />
                      {tier.mileage_limit_km.toLocaleString()} km/month
                    </div>

                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
                      {tier.insurance_level ||
                        'Insurance included'}
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[var(--success)]" />
                      {tier.includes_delivery
                        ? 'Home delivery included'
                        : 'Pickup option'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Duration */}

        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
              Step 2
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Rental duration
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {durations.map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => {
                  setDuration(months)
                  setSaved(false)
                }}
                className={[
                  'min-h-[72px] rounded-2xl border px-4 text-center transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                  duration === months
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
                ].join(' ')}
              >
                <span className="block text-lg font-bold">
                  {months}
                </span>

                <span className="text-xs text-[var(--muted-foreground)]">
                  {months === 1 ? 'Month' : 'Months'}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-3 rounded-xl bg-[var(--muted)] p-3 text-xs leading-5 text-[var(--muted-foreground)]">
            Duration-based discounts will be applied here
            once your final pricing rules are configured.
          </p>
        </section>

        {/* Start Date */}

        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
              Step 3
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Start date
            </h2>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              When should your rental start?
            </span>

            <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4">
              <CalendarDays className="h-5 w-5 text-[var(--accent)]" />

              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  setSaved(false)
                }}
                min={
                  new Date()
                    .toISOString()
                    .split('T')[0]
                }
                className="w-full bg-transparent text-sm outline-none"
                required
              />
            </div>
          </label>
        </section>

        {/* Delivery */}

        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
              Step 4
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Delivery or pickup
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setDeliveryType('pickup')
                setSaved(false)
              }}
              className={[
                'rounded-2xl border p-5 text-left transition-all',
                deliveryType === 'pickup'
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
              ].join(' ')}
            >
              <MapPin className="h-6 w-6 text-[var(--accent)]" />

              <h3 className="mt-3 font-semibold">
                Pick up the car
              </h3>

              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Collect your vehicle from the selected
                Dubai location.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setDeliveryType('home_delivery')
                setSaved(false)
              }}
              className={[
                'rounded-2xl border p-5 text-left transition-all',
                deliveryType === 'home_delivery'
                  ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
              ].join(' ')}
            >
              <Home className="h-6 w-6 text-[var(--accent)]" />

              <h3 className="mt-3 font-semibold">
                Home delivery
              </h3>

              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Have the vehicle delivered to your Dubai
                address.
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
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
            </div>
          )}
        </section>

        {/* Add-ons */}

        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
              Step 5
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Optional add-ons
            </h2>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Add extra services to your monthly rental.
            </p>
          </div>

          {addOns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-5 text-sm text-[var(--muted-foreground)]">
              No optional add-ons are available yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleAddOns.map((addOn) => {
                const selected =
                  selectedAddOns.includes(addOn.id)

                return (
                  <button
                    key={addOn.id}
                    type="button"
                    onClick={() =>
                      toggleAddOn(addOn.id)
                    }
                    className={[
                      'flex min-h-[100px] items-start gap-4 rounded-2xl border p-4 text-left transition-all',
                      selected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                        selected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                          : 'border-[var(--border)]',
                      ].join(' ')}
                    >
                      {selected && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">
                            {addOn.name}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                            {addOn.description ||
                              'Optional rental service'}
                          </p>
                        </div>

                        <span className="whitespace-nowrap text-sm font-bold text-[var(--accent)]">
                          {formatAED(
                            Number(addOn.price_aed)
                          )}
                          {addOn.price_type ===
                          'monthly'
                            ? '/mo'
                            : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Save */}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          {saved && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-[var(--success)]/10 p-3 text-sm text-[var(--success)]">
              <Check className="h-4 w-4" />
              Booking selection saved successfully.
            </div>
          )}

          {kycMessage && (
            <div className="mb-4 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 text-sm text-[var(--warning)]">
              <p className="font-semibold">KYC verification required</p>
              <p className="mt-1 leading-5">{kycMessage}</p>
            </div>
          )}

          {!startDate && (
            <p className="mb-4 text-sm text-[var(--warning)]">
              Please select a start date before continuing.
            </p>
          )}

          {deliveryType === 'home_delivery' &&
            !deliveryAddress.trim() && (
              <p className="mb-4 text-sm text-[var(--warning)]">
                Please enter your delivery address.
              </p>
            )}

          <button
            type="button"
            onClick={saveBookingSelection}
            disabled={
              submitting ||
              !startDate ||
              (deliveryType === 'home_delivery' &&
                !deliveryAddress.trim())
            }
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creating booking...' : 'Continue with this selection'}
            {!submitting && <ChevronRight className="h-5 w-5" />}
          </button>

          <p className="mt-3 text-center text-xs leading-5 text-[var(--muted-foreground)]">
            Your selection will be saved temporarily. Login,
            KYC, agreement and payment will be connected in
            the next booking steps.
          </p>
        </div>
      </div>

      {/* =====================================================
          RIGHT — SUMMARY
      ====================================================== */}

      <aside className="h-fit lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="bg-[var(--primary)] p-5 text-[var(--primary-foreground)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />

              <h2 className="font-semibold">
                Booking Summary
              </h2>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Vehicle
              </p>

              <p className="mt-1 font-semibold">
                {vehicle.make} {vehicle.model}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Plan
              </p>

              <p className="mt-1 font-semibold">
                {selectedPricing?.pricing_tiers?.name}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Duration
              </p>

              <p className="mt-1 font-semibold">
                {duration}{' '}
                {duration === 1 ? 'month' : 'months'}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Delivery
              </p>

              <p className="mt-1 font-semibold">
                {deliveryType === 'pickup'
                  ? 'Pickup'
                  : 'Home delivery'}
              </p>
            </div>

            {deliveryType === 'home_delivery' && (
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Delivery fee
                </p>

                <p className="mt-1 font-semibold">
                  {homeDeliveryIncluded
                    ? 'Included'
                    : homeDeliveryFee > 0
                      ? formatAED(homeDeliveryFee)
                      : 'Configured at checkout'}
                </p>
              </div>
            )}

            <div className="border-t border-[var(--border)] pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">
                  Monthly rental
                </span>

                <span className="font-medium">
                  {formatAED(monthlyPrice)}
                </span>
              </div>

              {monthlyAddOnTotal > 0 && (
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    Monthly add-ons
                  </span>

                  <span className="font-medium">
                    {formatAED(monthlyAddOnTotal)}
                  </span>
                </div>
              )}

              {oneTimeAddOnTotal > 0 && (
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">
                    One-time add-ons
                  </span>

                  <span className="font-medium">
                    {formatAED(oneTimeAddOnTotal)}
                  </span>
                </div>
              )}

              <div className="mt-3 flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">
                  Security deposit
                </span>

                <span className="font-medium">
                  {formatAED(deposit)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--muted)] p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Estimated first payment
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {formatAED(
                      estimatedFirstPayment
                    )}
                  </p>
                </div>

                <p className="text-right text-xs text-[var(--muted-foreground)]">
                  Before configured
                  <br />
                  duration discounts
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl bg-[var(--success)]/10 p-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" />

              <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                Your final booking will be confirmed only
                after KYC approval, agreement acceptance
                and successful payment.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}