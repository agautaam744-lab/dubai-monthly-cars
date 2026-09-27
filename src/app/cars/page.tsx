import Link from 'next/link'
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Users,
  Fuel,
  Gauge,
  CarFront,
  RotateCcw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Record<string, string | string[] | undefined>

type VehicleImage = {
  id: string
  storage_path: string
  is_primary: boolean | null
  sort_order: number | null
}

type PricingTier = {
  id: string
  name: string
  mileage_limit_km: number
  insurance_level: string | null
  includes_delivery: boolean | null
  sort_order: number | null
}

type VehiclePricing = {
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

function getValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function formatAED(value: number | string) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function getStartingPrice(vehicle: Vehicle) {
  if (!vehicle.vehicle_pricing?.length) return null

  const prices = vehicle.vehicle_pricing
    .map((item) => Number(item.monthly_price_aed))
    .filter((price) => Number.isFinite(price))

  if (!prices.length) return null

  return Math.min(...prices)
}

function FilterForm({
  mobile = false,
  categories,
  brands,
  locations,
  values,
}: {
  mobile?: boolean
  categories: string[]
  brands: string[]
  locations: string[]
  values: {
    category: string
    brand: string
    transmission: string
    fuel: string
    seats: string
    minPrice: string
    maxPrice: string
    location: string
  }
}) {
  return (
    <form
      method="GET"
      className={
        mobile
          ? 'space-y-4'
          : 'space-y-5'
      }
    >
      <div>
        <label
          htmlFor={`${mobile ? 'mobile-' : ''}category`}
          className="mb-2 block text-sm font-medium"
        >
          Category
        </label>

        <select
          id={`${mobile ? 'mobile-' : ''}category`}
          name="category"
          defaultValue={values.category}
          className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${mobile ? 'mobile-' : ''}brand`}
          className="mb-2 block text-sm font-medium"
        >
          Brand
        </label>

        <select
          id={`${mobile ? 'mobile-' : ''}brand`}
          name="brand"
          defaultValue={values.brand}
          className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">All brands</option>
          {brands.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${mobile ? 'mobile-' : ''}transmission`}
          className="mb-2 block text-sm font-medium"
        >
          Transmission
        </label>

        <select
          id={`${mobile ? 'mobile-' : ''}transmission`}
          name="transmission"
          defaultValue={values.transmission}
          className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">Any transmission</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
      </div>

      <div>
        <label
          htmlFor={`${mobile ? 'mobile-' : ''}fuel`}
          className="mb-2 block text-sm font-medium"
        >
          Fuel
        </label>

        <select
          id={`${mobile ? 'mobile-' : ''}fuel`}
          name="fuel"
          defaultValue={values.fuel}
          className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">Any fuel type</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Electric">Electric</option>
        </select>
      </div>

      <div>
        <label
          htmlFor={`${mobile ? 'mobile-' : ''}seats`}
          className="mb-2 block text-sm font-medium"
        >
          Seats
        </label>

        <select
          id={`${mobile ? 'mobile-' : ''}seats`}
          name="seats"
          defaultValue={values.seats}
          className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">Any</option>
          <option value="2">2 seats</option>
          <option value="4">4 seats</option>
          <option value="5">5 seats</option>
          <option value="7">7 seats</option>
          <option value="8">8 seats</option>
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium"
        >
          Monthly price
        </label>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="minPrice"
            defaultValue={values.minPrice}
            min="0"
            placeholder="Min AED"
            className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />

          <input
            type="number"
            name="maxPrice"
            defaultValue={values.maxPrice}
            min="0"
            placeholder="Max AED"
            className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`${mobile ? 'mobile-' : ''}location`}
          className="mb-2 block text-sm font-medium"
        >
          Location
        </label>

        <select
          id={`${mobile ? 'mobile-' : ''}location`}
          name="location"
          defaultValue={values.location}
          className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">All locations</option>
          {locations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
      >
        <Search className="h-4 w-4" />
        Apply Filters
      </button>

      <Link
        href="/cars"
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-medium transition hover:bg-[var(--muted)]"
      >
        <RotateCcw className="h-4 w-4" />
        Reset Filters
      </Link>
    </form>
  )
}

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const values = {
    category: getValue(params.category),
    brand: getValue(params.brand),
    transmission: getValue(params.transmission),
    fuel: getValue(params.fuel),
    seats: getValue(params.seats),
    minPrice: getValue(params.minPrice),
    maxPrice: getValue(params.maxPrice),
    location: getValue(params.location),
  }

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
        monthly_price_aed,
        security_deposit_aed,
        pricing_tiers (
          id,
          name,
          mileage_limit_km,
          insurance_level,
          includes_delivery,
          sort_order
        )
      )
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

if (error) {
  console.error('VEHICLES QUERY ERROR:', error)

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10">
          <CarFront className="h-8 w-8 text-[var(--danger)]" />
        </div>

        <h1 className="mt-6 text-2xl font-bold">
          Fleet unavailable
        </h1>

        <p className="mt-3 text-[var(--muted-foreground)]">
          Supabase returned an error while loading the vehicles.
        </p>

        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--danger)]">
            Supabase Error
          </p>

          <p className="mt-3 break-words font-mono text-sm text-[var(--foreground)]">
            {error.message}
          </p>

          {error.details && (
            <p className="mt-3 break-words text-sm text-[var(--muted-foreground)]">
              {error.details}
            </p>
          )}

          {error.hint && (
            <p className="mt-3 break-words text-sm text-[var(--muted-foreground)]">
              Hint: {error.hint}
            </p>
          )}

          {error.code && (
            <p className="mt-3 font-mono text-xs text-[var(--muted-foreground)]">
              Code: {error.code}
            </p>
          )}
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)]"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}

  const allVehicles = (data ?? []) as unknown as Vehicle[]

  const categories = Array.from(
    new Set(
      allVehicles
        .map((vehicle) => vehicle.category)
        .filter(Boolean)
    )
  ) as string[]

  const brands = Array.from(
    new Set(
      allVehicles
        .map((vehicle) => vehicle.make)
        .filter(Boolean)
    )
  ) as string[]

  const locations = Array.from(
    new Set(
      allVehicles
        .map((vehicle) => vehicle.location)
        .filter(Boolean)
    )
  ) as string[]

  const minPrice = Number(values.minPrice || 0)
  const maxPrice = Number(values.maxPrice || 0)
  const seats = Number(values.seats || 0)

  const vehicles = allVehicles.filter((vehicle) => {
    const startingPrice = getStartingPrice(vehicle)

    if (
      values.category &&
      vehicle.category?.toLowerCase() !== values.category.toLowerCase()
    ) {
      return false
    }

    if (
      values.brand &&
      vehicle.make?.toLowerCase() !== values.brand.toLowerCase()
    ) {
      return false
    }

    if (
      values.transmission &&
      vehicle.transmission !== values.transmission
    ) {
      return false
    }

    if (
      values.fuel &&
      vehicle.fuel_type !== values.fuel
    ) {
      return false
    }

    if (
      seats &&
      vehicle.seats !== seats
    ) {
      return false
    }

    if (
      values.location &&
      vehicle.location?.toLowerCase() !== values.location.toLowerCase()
    ) {
      return false
    }

    if (
      minPrice > 0 &&
      (startingPrice === null || startingPrice < minPrice)
    ) {
      return false
    }

    if (
      maxPrice > 0 &&
      (startingPrice === null || startingPrice > maxPrice)
    ) {
      return false
    }

    return true
  })

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Dubai Monthly Fleet
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Find your monthly car
            </h1>

            <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
              Choose from available vehicles and find a monthly
              plan that fits your driving needs.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          MOBILE FILTER
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 md:hidden lg:px-8">
        <details className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 font-semibold">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[var(--accent)]" />
              Filters
            </span>

            <span className="text-sm text-[var(--muted-foreground)]">
              {vehicles.length} cars
            </span>
          </summary>

          <div className="border-t border-[var(--border)] p-4">
            <FilterForm
              mobile
              categories={categories}
              brands={brands}
              locations={locations}
              values={values}
            />
          </div>
        </details>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 md:grid-cols-[250px_minmax(0,1fr)]">

          {/* DESKTOP FILTER */}

          <aside className="hidden h-fit rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:block">
            <div className="mb-5 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[var(--accent)]" />

              <h2 className="font-semibold">
                Filter Cars
              </h2>
            </div>

            <FilterForm
              categories={categories}
              brands={brands}
              locations={locations}
              values={values}
            />
          </aside>

          {/* VEHICLES */}

          <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {vehicles.length} vehicle
                  {vehicles.length === 1 ? '' : 's'} available
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <MapPin className="h-4 w-4" />
                Dubai
              </div>
            </div>

            {vehicles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--muted)]">
                  <CarFront className="h-8 w-8 text-[var(--muted-foreground)]" />
                </div>

                <h2 className="mt-5 text-xl font-semibold">
                  No cars found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
                  Try changing your filters or reset them to
                  see the full available fleet.
                </p>

                <Link
                  href="/cars"
                  className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)]"
                >
                  Reset Filters
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((vehicle) => {
                  const startingPrice =
                    getStartingPrice(vehicle)

                  const primaryImage =
                    vehicle.vehicle_images
                      ?.filter((image) => image.is_primary)
                      ?.sort(
                        (a, b) =>
                          (a.sort_order ?? 0) -
                          (b.sort_order ?? 0)
                      )[0]

                  return (
                    <article
                      key={vehicle.id}
                      className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* IMAGE AREA */}

                      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--muted)]">
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--muted)] to-[var(--card)]">
                          <CarFront className="h-16 w-16 text-[var(--accent)]/30" />
                        </div>

                        {primaryImage?.storage_path && (
                          <div className="absolute left-3 top-3 rounded-full bg-[var(--background)]/90 px-3 py-1 text-xs font-medium backdrop-blur">
                            Photo available
                          </div>
                        )}

                        <div className="absolute right-3 top-3 rounded-full bg-[var(--success)] px-3 py-1 text-xs font-semibold text-white">
                          Available
                        </div>
                      </div>

                      {/* CONTENT */}

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                              {vehicle.category || 'Car'}
                            </p>

                            <h2 className="mt-1 text-xl font-semibold">
                              {vehicle.make} {vehicle.model}
                            </h2>

                            {vehicle.year && (
                              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                {vehicle.year}
                              </p>
                            )}
                          </div>

                          {startingPrice !== null && (
                            <div className="text-right">
                              <p className="text-xs text-[var(--muted-foreground)]">
                                From
                              </p>

                              <p className="whitespace-nowrap text-lg font-bold text-[var(--accent)]">
                                {formatAED(startingPrice)}
                              </p>

                              <p className="text-xs text-[var(--muted-foreground)]">
                                / month
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                            <Users className="h-4 w-4 shrink-0" />
                            <span>
                              {vehicle.seats || '-'} seats
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                            <Fuel className="h-4 w-4 shrink-0" />
                            <span>
                              {vehicle.fuel_type || '-'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                            <Gauge className="h-4 w-4 shrink-0" />
                            <span>
                              {vehicle.transmission || '-'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {vehicle.location || 'Dubai'}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/cars/${vehicle.id}`}
                          className="mt-5 flex min-h-[46px] w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
                        >
                          View Details
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}