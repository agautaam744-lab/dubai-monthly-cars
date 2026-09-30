import Link from 'next/link'
import { Search, MapPin, CarFront, RotateCcw, TriangleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import VehicleCard, {
  getStartingPrice,
  type CarsVehicle,
} from './VehicleCard'
import FilterForm from './FilterForm'
import MobileFilterDrawer from './MobileFilterDrawer'
import SortSelect from './SortSelect'

type SearchParams = Record<string, string | string[] | undefined>

function getValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function hrefWith(
  base: SearchParams,
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams()
  for (const [key, raw] of Object.entries({ ...base, ...overrides })) {
    const value = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `/cars?${query}` : '/cars'
}

const VALID_SORTS = ['newest', 'price-asc', 'price-desc'] as const

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const values = {
    q: getValue(params.q).trim(),
    category: getValue(params.category),
    brand: getValue(params.brand),
    transmission: getValue(params.transmission),
    fuel: getValue(params.fuel),
    seats: getValue(params.seats),
    minPrice: getValue(params.minPrice),
    maxPrice: getValue(params.maxPrice),
    location: getValue(params.location),
    sort: VALID_SORTS.includes(getValue(params.sort) as (typeof VALID_SORTS)[number])
      ? getValue(params.sort)
      : 'newest',
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(
      `
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
    `
    )
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--danger)]/20 to-[var(--danger)]/5 ring-1 ring-inset ring-[var(--danger)]/20">
            <TriangleAlert
              className="h-8 w-8 text-[var(--danger)]"
              aria-hidden="true"
            />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Unable to load cars right now</h1>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted-foreground)]">
            Something went wrong while fetching the fleet. Please try again in
            a moment.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/cars"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[var(--border)] px-6 text-sm font-semibold transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const allVehicles = (data ?? []) as unknown as CarsVehicle[]

  const categories = Array.from(
    new Set(allVehicles.map((vehicle) => vehicle.category).filter(Boolean))
  ) as string[]

  const brands = Array.from(
    new Set(allVehicles.map((vehicle) => vehicle.make).filter(Boolean))
  ) as string[]

  const locations = Array.from(
    new Set(allVehicles.map((vehicle) => vehicle.location).filter(Boolean))
  ) as string[]

  const minPrice = toNumber(values.minPrice)
  const maxPrice = toNumber(values.maxPrice)
  const seats = toNumber(values.seats)
  const query = values.q.toLowerCase()

  const filtered = allVehicles.filter((vehicle) => {
    const startingPrice = getStartingPrice(vehicle)

    if (query) {
      const haystack =
        `${vehicle.make ?? ''} ${vehicle.model ?? ''} ${vehicle.category ?? ''}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }

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

    if (values.transmission && vehicle.transmission !== values.transmission) {
      return false
    }

    if (values.fuel && vehicle.fuel_type !== values.fuel) {
      return false
    }

    if (seats && vehicle.seats !== seats) {
      return false
    }

    if (
      values.location &&
      vehicle.location?.toLowerCase() !== values.location.toLowerCase()
    ) {
      return false
    }

    if (minPrice > 0 && (startingPrice === null || startingPrice < minPrice)) {
      return false
    }

    if (maxPrice > 0 && (startingPrice === null || startingPrice > maxPrice)) {
      return false
    }

    return true
  })

  const vehicles = [...filtered].sort((a, b) => {
    if (values.sort === 'price-asc') {
      const pa = getStartingPrice(a)
      const pb = getStartingPrice(b)
      if (pa === null && pb === null) return 0
      if (pa === null) return 1
      if (pb === null) return -1
      return pa - pb
    }
    if (values.sort === 'price-desc') {
      const pa = getStartingPrice(a)
      const pb = getStartingPrice(b)
      if (pa === null && pb === null) return 0
      if (pa === null) return 1
      if (pb === null) return -1
      return pb - pa
    }
    return 0
  })

  const activeFilterCount = [
    values.q,
    values.category,
    values.brand,
    values.transmission,
    values.fuel,
    values.seats,
    values.minPrice,
    values.maxPrice,
    values.location,
  ].filter(Boolean).length

  const filterValues = {
    brand: values.brand,
    transmission: values.transmission,
    fuel: values.fuel,
    seats: values.seats,
    minPrice: values.minPrice,
    maxPrice: values.maxPrice,
    location: values.location,
  }
  const preserved = {
    q: values.q,
    sort: values.sort === 'newest' ? '' : values.sort,
    category: values.category,
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--muted)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_50%_0%,rgba(201,162,39,0.14),transparent)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Dubai Monthly Fleet
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Find your perfect monthly car
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            Transparent monthly pricing in AED — no daily rates, no hidden
            fees. {allVehicles.length} car{allVehicles.length === 1 ? '' : 's'}{' '}
            ready to rent.
          </p>

          <form
            method="GET"
            role="search"
            className="mt-5 flex max-w-xl gap-2"
          >
            {/* Preserve the rest of the state across searches */}
            {values.category && (
              <input type="hidden" name="category" value={values.category} />
            )}
            {values.sort !== 'newest' && (
              <input type="hidden" name="sort" value={values.sort} />
            )}
            {values.brand && <input type="hidden" name="brand" value={values.brand} />}
            {values.transmission && (
              <input type="hidden" name="transmission" value={values.transmission} />
            )}
            {values.fuel && <input type="hidden" name="fuel" value={values.fuel} />}
            {values.seats && <input type="hidden" name="seats" value={values.seats} />}
            {values.minPrice && (
              <input type="hidden" name="minPrice" value={values.minPrice} />
            )}
            {values.maxPrice && (
              <input type="hidden" name="maxPrice" value={values.maxPrice} />
            )}
            {values.location && (
              <input type="hidden" name="location" value={values.location} />
            )}
            <label htmlFor="cars-search" className="sr-only">
              Search by make, model or category
            </label>
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                aria-hidden="true"
              />
              <input
                id="cars-search"
                type="search"
                name="q"
                defaultValue={values.q}
                placeholder="Search make, model or category…"
                autoComplete="off"
                className="min-h-[52px] w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] ps-11 pe-4 text-sm shadow-sm outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] shadow-sm transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* CATEGORY PILLS */}
      {categories.length > 0 && (
        <div className="border-b border-[var(--border)] bg-[var(--background)]">
          <nav
            aria-label="Browse by category"
            className="mx-auto max-w-7xl overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden"
          >
            <ul className="flex gap-2 py-3">
              <li className="shrink-0">
                <Link
                  href={hrefWith(params, { category: undefined })}
                  aria-current={!values.category ? 'page' : undefined}
                  className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                    !values.category
                      ? 'border-[var(--accent)] bg-[var(--accent)] font-semibold text-[var(--accent-foreground)] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  All Cars
                </Link>
              </li>
              {categories.map((category) => {
                const active =
                  values.category.toLowerCase() === category.toLowerCase()
                return (
                  <li key={category} className="shrink-0">
                    <Link
                      href={hrefWith(params, { category })}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)] font-semibold text-[var(--accent-foreground)] shadow-sm'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50'
                      }`}
                    >
                      {category}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* DESKTOP FILTER */}
          <aside
            aria-label="Filter cars"
            className="hidden h-fit rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 lg:block lg:sticky lg:top-24"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <span
                  aria-label={`${activeFilterCount} filters active`}
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-[var(--accent-foreground)]"
                >
                  {activeFilterCount}
                </span>
              )}
            </div>
            <FilterForm
              idPrefix="desktop"
              brands={brands}
              locations={locations}
              values={filterValues}
              preserved={preserved}
            />
          </aside>

          {/* RESULTS */}
          <div className="min-w-0">
            {/* MOBILE CONTROLS */}
            <div className="mb-4 flex gap-2 lg:hidden">
              <MobileFilterDrawer
                activeCount={activeFilterCount}
                resultsCount={vehicles.length}
              >
                <FilterForm
                  idPrefix="mobile"
                  brands={brands}
                  locations={locations}
                  values={filterValues}
                  preserved={preserved}
                />
              </MobileFilterDrawer>
              <SortSelect value={values.sort} />
            </div>

            {/* RESULTS TOOLBAR */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p
                className="text-sm text-[var(--muted-foreground)]"
                role="status"
                aria-live="polite"
              >
                <span className="text-base font-bold text-[var(--foreground)]">
                  {vehicles.length}
                </span>{' '}
                car{vehicles.length === 1 ? '' : 's'} available
                {activeFilterCount > 0 && (
                  <>
                    {' '}·{' '}
                    <Link
                      href="/cars"
                      className="font-medium text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
                    >
                      Clear {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}
                    </Link>
                  </>
                )}
              </p>

              <div className="hidden items-center gap-2 text-sm text-[var(--muted-foreground)] lg:flex">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Dubai
              </div>

              <div className="hidden lg:block lg:w-56">
                <SortSelect value={values.sort} />
              </div>
            </div>

            {vehicles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/20">
                  <CarFront
                    className="h-8 w-8 text-[var(--muted-foreground)]"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="mt-5 text-xl font-semibold">
                  No cars match your filters
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
                  {values.q
                    ? `Nothing found for “${values.q}”. Try a different search or clear your filters to see the full fleet.`
                    : 'Try changing your filters or reset them to see the full available fleet.'}
                </p>
                <Link
                  href="/cars"
                  className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
