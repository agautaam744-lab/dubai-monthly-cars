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
  Sparkles,
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
      vehicle_images (id, storage_path, is_primary, sort_order),
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
    (a, b) => Number(a.monthly_price_aed) - Number(b.monthly_price_aed)
  )

  const images = [...(vehicle.vehicle_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  const { data: reservations } = await supabase
    .from('bookings')
    .select('start_date, end_date, status')
    .eq('vehicle_id', id)

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/cars"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--accent)]"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            Back to Cars
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* LEFT: VISUAL + SPECS + CALENDAR */}
          <div>
            {/* MAIN IMAGE */}
            <div className="group relative aspect-[16/10] overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--muted)] to-[var(--card)]">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-images/${images[0].storage_path}`}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="eager"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CarFront className="h-32 w-32 text-[var(--accent)]/25" />
                </div>
              )}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
              />

              {vehicle.category && (
                <div className="absolute start-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-md">
                  {vehicle.category}
                </div>
              )}

              {images.length > 0 && (
                <div className="absolute end-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                  {images.length} photo{images.length === 1 ? '' : 's'}
                </div>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-4 start-4 flex gap-2">
                  {images.slice(1, 4).map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-images/${img.storage_path}`}
                      alt=""
                      className="h-16 w-24 rounded-lg border border-white/40 object-cover shadow-lg backdrop-blur"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* SPEC CARDS */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
                <Users className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Seats
                </p>
                <p className="mt-1 text-lg font-bold">{vehicle.seats || '—'}</p>
              </div>

              <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
                <Fuel className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Fuel
                </p>
                <p className="mt-1 truncate text-lg font-bold">
                  {vehicle.fuel_type || '—'}
                </p>
              </div>

              <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
                <Gauge className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Gearbox
                </p>
                <p className="mt-1 truncate text-lg font-bold">
                  {vehicle.transmission || '—'}
                </p>
              </div>

              <div className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
                <MapPin className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                  Location
                </p>
                <p className="mt-1 truncate text-lg font-bold">
                  {vehicle.location || 'Dubai'}
                </p>
              </div>
            </div>

            <AvailabilityCalendar bookings={reservations ?? []} />

            {/* FUEL POLICY */}
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="font-semibold">Fuel policy</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                Same-to-same: return the car with the same fuel level as at pickup
                ({vehicle.fuel_type || 'petrol'}). Refuelling charges plus a AED 50
                service fee apply if returned lower. Electric vehicles: return with
                at least 80% charge or a AED 75 charging fee applies.
              </p>
            </div>
          </div>

          {/* RIGHT: DETAILS + PRICING */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {vehicle.category || 'Monthly Rental'}
            </p>

            <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
              {vehicle.make} {vehicle.model}
            </h1>

            <p className="mt-3 text-base text-[var(--muted-foreground)]">
              {vehicle.year || 'Premium fleet vehicle'}
              {vehicle.color ? ` · ${vehicle.color}` : ''}
            </p>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
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
              <h2 className="font-serif text-2xl tracking-tight">
                Choose your plan
              </h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Compare mileage, insurance and delivery benefits.
              </p>

              {pricing.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
                  Pricing is currently unavailable for this vehicle.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {pricing.map((item, idx) => {
                    const isFirst = idx === 0
                    return (
                      <div
                        key={item.id}
                        className={`group relative overflow-hidden rounded-2xl border bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                          isFirst
                            ? 'border-[var(--accent)]/50 shadow-md shadow-[var(--accent)]/5'
                            : 'border-[var(--border)] hover:border-[var(--accent)]/40'
                        }`}
                      >
                        {isFirst && (
                          <div className="absolute end-4 top-4 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            Popular
                          </div>
                        )}

                        <div>
                          <h3 className="font-serif text-2xl tracking-tight">
                            {item.pricing_tiers?.name || 'Monthly Plan'}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            {item.pricing_tiers?.description ||
                              'Flexible monthly vehicle plan'}
                          </p>
                        </div>

                        <div className="mt-4 flex items-baseline gap-1.5">
                          <span className="text-3xl font-bold tabular-nums tracking-tight text-[var(--accent)]">
                            {formatAED(item.monthly_price_aed)}
                          </span>
                          <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            / month
                          </span>
                        </div>

                        <ul className="mt-5 space-y-2.5">
                          <li className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            {Number(
                              item.pricing_tiers?.mileage_limit_km ?? 0
                            ).toLocaleString()}{' '}
                            km / month
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            {item.pricing_tiers?.insurance_level ||
                              'Insurance included'}
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            {item.pricing_tiers?.includes_delivery
                              ? 'Home delivery included'
                              : 'Pickup option available'}
                          </li>
                          <li className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            Deposit {formatAED(item.security_deposit_aed)}
                          </li>
                        </ul>

                        <Link
                          href={`/booking?vehicle=${vehicle.id}&tier=${item.pricing_tiers?.id ?? ''}`}
                          className={`mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98] ${
                            isFirst
                              ? 'bg-[var(--accent)] text-white shadow-sm shadow-[var(--accent)]/20 hover:bg-[var(--accent-hover)] hover:shadow-md'
                              : 'border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--accent)]/60 hover:text-[var(--accent)]'
                          }`}
                        >
                          Choose This Plan
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}