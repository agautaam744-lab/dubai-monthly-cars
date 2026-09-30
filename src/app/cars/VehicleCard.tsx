import Link from 'next/link'
import {
  Users,
  Fuel,
  Gauge,
  MapPin,
  CarFront,
  ArrowRight,
} from 'lucide-react'

export type CarsVehicleImage = {
  id: string
  storage_path: string
  is_primary: boolean | null
  sort_order: number | null
}

export type CarsPricingTier = {
  id: string
  name: string
  mileage_limit_km: number
  insurance_level: string | null
  includes_delivery: boolean | null
  sort_order: number | null
}

export type CarsVehiclePricing = {
  monthly_price_aed: number | string
  security_deposit_aed: number | string
  pricing_tiers: CarsPricingTier | null
}

export type CarsVehicle = {
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
  vehicle_images: CarsVehicleImage[]
  vehicle_pricing: CarsVehiclePricing[]
}

export function formatAED(value: number | string) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export function vehicleImageUrl(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicle-images/${storagePath}`
}

function sortedPricing(vehicle: CarsVehicle) {
  return [...(vehicle.vehicle_pricing ?? [])]
    .map((item) => ({
      item,
      price: Number(item.monthly_price_aed),
    }))
    .filter((row) => Number.isFinite(row.price))
    .sort((a, b) => a.price - b.price)
}

export function getStartingPrice(vehicle: CarsVehicle) {
  const rows = sortedPricing(vehicle)
  return rows.length ? rows[0].price : null
}

/** Cheapest tier id for the direct Book Now deep-link. Null when unknown. */
export function getCheapestTierId(vehicle: CarsVehicle) {
  const rows = sortedPricing(vehicle)
  for (const row of rows) {
    if (row.item.pricing_tiers?.id) return row.item.pricing_tiers.id
  }
  return null
}

export function getMinDeposit(vehicle: CarsVehicle) {
  const deposits = (vehicle.vehicle_pricing ?? [])
    .map((item) => Number(item.security_deposit_aed))
    .filter((value) => Number.isFinite(value) && value > 0)
  return deposits.length ? Math.min(...deposits) : null
}

export function getCheapestMileage(vehicle: CarsVehicle) {
  const rows = sortedPricing(vehicle)
  for (const row of rows) {
    const limit = Number(row.item.pricing_tiers?.mileage_limit_km)
    if (Number.isFinite(limit) && limit > 0) return limit
  }
  return null
}

export default function VehicleCard({ vehicle }: { vehicle: CarsVehicle }) {
  const startingPrice = getStartingPrice(vehicle)
  const tierId = getCheapestTierId(vehicle)
  const deposit = getMinDeposit(vehicle)
  const mileage = getCheapestMileage(vehicle)

  const images = [...(vehicle.vehicle_images ?? [])].sort((a, b) => {
    const aPrimary = a.is_primary ? 0 : 1
    const bPrimary = b.is_primary ? 0 : 1
    if (aPrimary !== bPrimary) return aPrimary - bPrimary
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })
  const primaryImage = images[0]?.storage_path ? images[0] : null

  const title = `${vehicle.make} ${vehicle.model}`

  return (
    <article
      aria-label={title}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg"
    >
      {/* IMAGE */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--muted)]">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicleImageUrl(primaryImage.storage_path)}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--muted)] to-[var(--card)]">
            <CarFront
              className="h-16 w-16 text-[var(--accent)]/30"
              aria-hidden="true"
            />
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.06]"
        />

        {vehicle.category && (
          <div className="absolute start-3 top-3 rounded-full bg-[var(--background)]/90 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur">
            {vehicle.category}
          </div>
        )}

        <div className="absolute end-3 top-3 flex items-center gap-1.5 rounded-full bg-[var(--success)] px-3 py-1 text-xs font-semibold text-white shadow-sm">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-white"
          />
          Available
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-xl font-semibold leading-snug">
          {title}{' '}
          {vehicle.year && (
            <span className="text-sm font-normal text-[var(--muted-foreground)]">
              {vehicle.year}
            </span>
          )}
        </h2>

        {startingPrice !== null ? (
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
              From
            </span>
            <span className="text-[1.65rem] font-bold tabular-nums tracking-tight text-[var(--accent)]">
              {formatAED(startingPrice)}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">/month</span>
          </div>
        ) : (
          <p className="mt-3 text-sm font-medium text-[var(--muted-foreground)]">
            Pricing on request
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-xl bg-[var(--muted)]/60 p-3 text-sm">
          <div className="flex items-center gap-2 text-[var(--foreground)]/80">
            <Users className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <span>{vehicle.seats ? `${vehicle.seats} seats` : '—'}</span>
          </div>

          <div className="flex items-center gap-2 text-[var(--foreground)]/80">
            <Fuel className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <span className="truncate">{vehicle.fuel_type || '—'}</span>
          </div>

          <div className="flex items-center gap-2 text-[var(--foreground)]/80">
            <Gauge className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <span className="truncate">{vehicle.transmission || '—'}</span>
          </div>

          <div className="flex items-center gap-2 text-[var(--foreground)]/80">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <span className="truncate">{vehicle.location || 'Dubai'}</span>
          </div>
        </div>

        {(mileage !== null || deposit !== null) && (
          <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
            {mileage !== null && `${mileage.toLocaleString()} km/mo included`}
            {mileage !== null && deposit !== null && ' · '}
            {deposit !== null &&
              `Refundable deposit from ${formatAED(deposit)}`}
          </p>
        )}

        <div className="mt-auto pt-5">
          <div className="grid grid-cols-2 gap-2">
          {tierId ? (
            <Link
              href={`/booking?vehicle=${vehicle.id}&tier=${tierId}`}
              className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
            >
              Book Now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--muted)] px-4 text-sm font-semibold text-[var(--muted-foreground)]">
              Enquire
            </span>
          )}

          <Link
            href={`/cars/${vehicle.id}`}
            aria-label={`View details for ${title}`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[var(--border)] px-4 text-sm font-semibold transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
          >
            View Details
          </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
