import Link from 'next/link'
import {
  ArrowLeft,
  CarFront,
  CheckCircle2,
  Fuel,
  Gauge,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AvailabilityCalendar from './AvailabilityCalendar'

type VehicleImage = {
  id: string
  storage_path: string
  is_primary: boolean | null
  sort_order: number | null
}

type PricingTier = {
  id: string
  name: string
  description: string | null
  mileage_limit_km: number
  insurance_level: string | null
  includes_delivery: boolean | null
  sort_order: number | null
}

type VehiclePricing = {
  id: string
  monthly_price_aed: number | string
  security_deposit_aed: number | string
  pricing_tiers: PricingTier | null
}

type Vehicle = {
  id: string
  make: string
  model: string
  year: number | null
  category: string | null
  transmission: string | null
  fuel_type: string | null
  seats: number | null
  color: string | null
  current_mileage: number | null
  status: string
  location: string | null
  description: string | null
  vehicle_images: VehicleImage[]
  vehicle_pricing: VehiclePricing[]
}

function formatAED(value: number | string) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export default async function VehicleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      make,
      model,
      year,
      category,
      transmission,
      fuel_type,
      seats,
      color,
      current_mileage,
      status,
      location,
      description,
      vehicle_images (
        id,
        storage_path,
        is_primary,
        sort_order
      ),
      vehicle_pricing (
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
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    notFound()
  }

  const vehicle = data as unknown as Vehicle

  const pricing = [...(vehicle.vehicle_pricing ?? [])].sort(
    (a, b) =>
      Number(a.monthly_price_aed) -
      Number(b.monthly_price_aed)
  )

  const images = [...(vehicle.vehicle_images ?? [])].sort(
    (a, b) =>
      (a.sort_order ?? 0) -
      (b.sort_order ?? 0)
  )

  const { data: reservations } = await supabase
    .from('bookings')
    .select('start_date, end_date, status')
    .eq('vehicle_id', id)

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/cars"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cars
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Vehicle visual */}

          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--muted)]">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-images/${images[0].storage_path}`}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--muted)] to-[var(--card)]">
                  <CarFront className="h-28 w-28 text-[var(--accent)]/25" />
                </div>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {images.slice(1, 4).map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-images/${img.storage_path}`}
                      alt=""
                      className="h-14 w-20 rounded-lg border border-white/40 object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              {images.length > 0 && (
                <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  {images.length} photo
                  {images.length === 1 ? '' : 's'}
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <Users className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Seats
                </p>
                <p className="mt-1 font-semibold">
                  {vehicle.seats || '-'}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <Fuel className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Fuel
                </p>
                <p className="mt-1 font-semibold">
                  {vehicle.fuel_type || '-'}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <Gauge className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Gearbox
                </p>
                <p className="mt-1 font-semibold">
                  {vehicle.transmission || '-'}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <MapPin className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Location
                </p>
                <p className="mt-1 truncate font-semibold">
                  {vehicle.location || 'Dubai'}
                </p>
              </div>
            </div>

            <AvailabilityCalendar bookings={reservations ?? []} />

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="font-semibold">Fuel policy</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Same-to-same: return the car with the same fuel level as at pickup
                ({vehicle.fuel_type || 'petrol'}). Refuelling charges plus a AED 50
                service fee apply if returned lower. Electric vehicles: return with
                at least 80% charge or a AED 75 charging fee applies.
              </p>
            </div>
          </div>

          {/* Vehicle information */}

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {vehicle.category || 'Monthly Rental'}
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {vehicle.make} {vehicle.model}
            </h1>

            <p className="mt-2 text-[var(--muted-foreground)]">
              {vehicle.year || 'Premium fleet vehicle'}
              {vehicle.color
                ? ` · ${vehicle.color}`
                : ''}
            </p>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[var(--success)]" />
                <span className="text-sm font-semibold">
                  Available for monthly rental
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                {vehicle.description ||
                  'Flexible monthly rental with multiple pricing tiers and mileage options.'}
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold">
                Choose your plan
              </h2>

              {pricing.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
                  Pricing is currently unavailable for
                  this vehicle.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {pricing.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {item.pricing_tiers?.name ||
                              'Monthly Plan'}
                          </h3>

                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            {item.pricing_tiers?.description ||
                              'Flexible monthly vehicle plan'}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-xl font-bold text-[var(--accent)]">
                            {formatAED(
                              item.monthly_price_aed
                            )}
                          </p>

                          <p className="text-xs text-[var(--muted-foreground)]">
                            per month
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                          {Number(
                            item.pricing_tiers
                              ?.mileage_limit_km ?? 0
                          ).toLocaleString()}{' '}
                          km / month
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                          {item.pricing_tiers
                            ?.insurance_level ||
                            'Insurance included'}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                          {item.pricing_tiers
                            ?.includes_delivery
                            ? 'Home delivery included'
                            : 'Pickup option available'}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                          Deposit{' '}
                          {formatAED(
                            item.security_deposit_aed
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/booking?vehicle=${vehicle.id}&tier=${item.pricing_tiers?.id ?? ''}`}
                        className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
                      >
                        Choose This Plan
                      </Link>
                    </div>
                  ))}
                </div>
              )}H
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}