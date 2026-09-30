import Link from 'next/link'
import { Search, RotateCcw } from 'lucide-react'

export type CarFilterValues = {
  brand: string
  transmission: string
  fuel: string
  seats: string
  minPrice: string
  maxPrice: string
  location: string
}

const inputClass =
  'min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition hover:border-[var(--accent)]/40 focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]'

export default function FilterForm({
  idPrefix,
  brands,
  locations,
  values,
  preserved,
}: {
  idPrefix: string
  brands: string[]
  locations: string[]
  values: CarFilterValues
  preserved: { q: string; sort: string; category: string }
}) {
  return (
    <form method="GET" className="space-y-5">
      {/* Preserve params owned by other controls (search, sort, category pills) */}
      <input type="hidden" name="q" value={preserved.q} />
      <input type="hidden" name="sort" value={preserved.sort} />
      <input type="hidden" name="category" value={preserved.category} />

      <div className="space-y-5 divide-y divide-[var(--border)] [&>div]:pt-5 [&>div:first-child]:pt-0">
      <div>
        <label htmlFor={`${idPrefix}-brand`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Brand
        </label>
        <select
          id={`${idPrefix}-brand`}
          name="brand"
          defaultValue={values.brand}
          className={inputClass}
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
          htmlFor={`${idPrefix}-transmission`}
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
        >
          Transmission
        </label>
        <select
          id={`${idPrefix}-transmission`}
          name="transmission"
          defaultValue={values.transmission}
          className={inputClass}
        >
          <option value="">Any transmission</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-fuel`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Fuel
        </label>
        <select
          id={`${idPrefix}-fuel`}
          name="fuel"
          defaultValue={values.fuel}
          className={inputClass}
        >
          <option value="">Any fuel type</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Electric">Electric</option>
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-seats`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Seats
        </label>
        <select
          id={`${idPrefix}-seats`}
          name="seats"
          defaultValue={values.seats}
          className={inputClass}
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
        <span id={`${idPrefix}-price-label`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]" role="presentation">
          Monthly price (AED)
        </span>
        <div
          className="grid grid-cols-2 gap-2"
          role="group"
          aria-labelledby={`${idPrefix}-price-label`}
        >
          <input
            type="number"
            name="minPrice"
            defaultValue={values.minPrice}
            min="0"
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum monthly price in AED"
            className={inputClass}
          />
          <input
            type="number"
            name="maxPrice"
            defaultValue={values.maxPrice}
            min="0"
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum monthly price in AED"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-location`}
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
        >
          Location
        </label>
        <select
          id={`${idPrefix}-location`}
          name="location"
          defaultValue={values.location}
          className={inputClass}
        >
          <option value="">All locations</option>
          {locations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      </div>

      <button
        type="submit"
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Apply Filters
      </button>

      <Link
        href="/cars"
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-medium transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset Filters
      </Link>
    </form>
  )
}
