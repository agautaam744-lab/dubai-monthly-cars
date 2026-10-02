import Link from 'next/link'
import { Search, MapPin, CarFront, RotateCcw, TriangleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getServerTranslation } from '@/lib/getServerLang'
import Navbar from '@/components/layout/Navbar'
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
  const { t } = await getServerTranslation()

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
      vehicle_images (id, storage_path, is_primary, sort_order),
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
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--danger)]/20 to-[var(--danger)]/5 ring-1 ring-inset ring-[var(--danger)]/20">
            <TriangleAlert className="h-8 w-8 text-[var(--danger)]" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">{t('cars.unableTitle')}</h1>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted-foreground)]">
            {t('cars.unableBody')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/cars"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
            >
              {t('cars.tryAgain')}
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[var(--border)] px-6 text-sm font-semibold transition hover:bg-[var(--muted)]"
            >
              {t('cars.backHome')}
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

    if (values.category && vehicle.category?.toLowerCase() !== values.category.toLowerCase()) return false
    if (values.brand && vehicle.make?.toLowerCase() !== values.brand.toLowerCase()) return false
    if (values.transmission && vehicle.transmission !== values.transmission) return false
    if (values.fuel && vehicle.fuel_type !== values.fuel) return false
    if (seats && vehicle.seats !== seats) return false
    if (values.location && vehicle.location?.toLowerCase() !== values.location.toLowerCase()) return false
    if (minPrice > 0 && (startingPrice === null || startingPrice < minPrice)) return false
    if (maxPrice > 0 && (startingPrice === null || startingPrice > maxPrice)) return false

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
      <Navbar />

      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.18),transparent)]"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {t('cars.tagline')}
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            {t('cars.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70 sm:text-lg">
            {t('cars.subtitle')}{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {allVehicles.length}
            </span>{' '}
            {allVehicles.length === 1 ? t('cars.car') : t('cars.carsPlural')}{' '}
            {t('cars.readyToRent')}.
          </p>

          {/* SEARCH BAR */}
          <form method="GET" role="search" className="mt-8 flex max-w-2xl gap-2">
            {values.category && <input type="hidden" name="category" value={values.category} />}
            {values.sort !== 'newest' && <input type="hidden" name="sort" value={values.sort} />}
            {values.brand && <input type="hidden" name="brand" value={values.brand} />}
            {values.transmission && <input type="hidden" name="transmission" value={values.transmission} />}
            {values.fuel && <input type="hidden" name="fuel" value={values.fuel} />}
            {values.seats && <input type="hidden" name="seats" value={values.seats} />}
            {values.minPrice && <input type="hidden" name="minPrice" value={values.minPrice} />}
            {values.maxPrice && <input type="hidden" name="maxPrice" value={values.maxPrice} />}
            {values.location && <input type="hidden" name="location" value={values.location} />}

            <label htmlFor="cars-search" className="sr-only">
              {t('cars.searchPlaceholder')}
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
                placeholder={t('cars.searchPlaceholder')}
                autoComplete="off"
                className="min-h-[52px] w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] ps-11 pe-4 text-sm shadow-sm outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--accent)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('cars.search')}</span>
            </button>
          </form>

          {/* STATS STRIP */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--foreground)]/60">
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live availability
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              {t('cars.dubai')}
            </span>
          </div>
        </div>
      </section>

      {/* CATEGORY PILLS */}
      {categories.length > 0 && (
        <div className="border-b border-[var(--border)] bg-[var(--background)]">
          <nav
            aria-label="Browse by category"
            className="mx-auto max-w-7xl overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden"
          >
            <ul className="flex gap-2 py-4">
              <li className="shrink-0">
                <Link
                  href={hrefWith(params, { category: undefined })}
                  aria-current={!values.category ? 'page' : undefined}
                  className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                    !values.category
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm shadow-[var(--accent)]/20'
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]'
                  }`}
                >
                  {t('cars.allCars')}
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
                      className={`inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm shadow-[var(--accent)]/20'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]'
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

      {/* RESULTS */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* DESKTOP FILTER */}
          <aside
            aria-label="Filter cars"
            className="hidden h-fit rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 lg:sticky lg:top-24 lg:block"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-lg tracking-tight">
                {t('cars.filtersHeading')}
              </h2>
              {activeFilterCount > 0 && (
                <span
                  aria-label={`${activeFilterCount} filters active`}
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-white"
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

            {/* TOOLBAR */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p
                className="text-sm text-[var(--muted-foreground)]"
                role="status"
                aria-live="polite"
              >
                <span className="text-lg font-bold text-[var(--foreground)]">
                  {vehicles.length}
                </span>{' '}
                {vehicles.length === 1 ? t('cars.car') : t('cars.carsPlural')}{' '}
                {t('cars.available')}
                {activeFilterCount > 0 && (
                  <>
                    {' '}·{' '}
                    <Link
                      href="/cars"
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {t('cars.clear')} {activeFilterCount}{' '}
                      {activeFilterCount === 1 ? t('cars.filter') : t('cars.filters')}
                    </Link>
                  </>
                )}
              </p>

              <div className="hidden lg:block lg:w-56">
                <SortSelect value={values.sort} />
              </div>
            </div>

            {vehicles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/20">
                  <CarFront className="h-8 w-8 text-[var(--muted-foreground)]" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-xl font-semibold">{t('cars.noMatchTitle')}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
                  {values.q ? t('cars.noMatchQuery') : t('cars.noMatchBody')}
                </p>
                <Link
                  href="/cars"
                  className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t('cars.clearFilters')}
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