import Link from 'next/link'
import {
  Users,
  Fuel,
  Gauge,
  MapPin,
  CarFront,
  ArrowRight,
  ShieldCheck,
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
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:hover:border-[var(--accent)]/40 motion-safe:hover:shadow-2xl motion-safe:hover:shadow-[var(--accent)]/10"
    >
      {/* IMAGE */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[var(--muted)] to-[var(--card)]">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicleImageUrl(primaryImage.storage_path)}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.08]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CarFront
              className="h-20 w-20 text-[var(--accent)]/25"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Cinematic gradient overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70 transition-opacity duration-300 motion-safe:group-hover:opacity-90"
        />

        {/* Top badges */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {vehicle.category && (
            <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              {vehicle.category}
            </span>
          )}

          <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Available
          </span>
        </div>

        {/* Bottom-left location overlay */}
        {vehicle.location && (
          <div className="absolute bottom-3 start-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {vehicle.location}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold leading-tight tracking-tight">
            {title}
            {vehicle.year && (
              <span className="ms-2 text-sm font-normal text-[var(--muted-foreground)]">
                {vehicle.year}
              </span>
            )}
          </h2>
        </div>

        {startingPrice !== null ? (
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
              From
            </span>
            <span className="text-2xl font-bold tabular-nums tracking-tight text-[var(--accent)]">
              {formatAED(startingPrice)}
            </span>
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              /month
            </span>
          </div>
        ) : (
          <p className="mt-4 text-sm font-medium text-[var(--muted-foreground)]">
            Pricing on request
          </p>
        )}

        {/* SPEC CHIPS */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {vehicle.seats ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)]/50 px-2.5 py-1 text-xs font-medium text-[var(--foreground)]/80">
              <Users className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
              {vehicle.seats} seats
            </span>
          ) : null}

          {vehicle.transmission ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)]/50 px-2.5 py-1 text-xs font-medium text-[var(--foreground)]/80">
              <Gauge className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
              {vehicle.transmission}
            </span>
          ) : null}

          {vehicle.fuel_type ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)]/50 px-2.5 py-1 text-xs font-medium text-[var(--foreground)]/80">
              <Fuel className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
              {vehicle.fuel_type}
            </span>
          ) : null}
        </div>

        {(mileage !== null || deposit !== null) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
            {mileage !== null && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                {mileage.toLocaleString()} km/mo
              </span>
            )}
            {deposit !== null && (
              <span>
                Deposit from{' '}
                <span className="font-medium text-[var(--foreground)]/80">
                  {formatAED(deposit)}
                </span>
              </span>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="mt-auto pt-5">
          <div className="grid grid-cols-2 gap-2">
            {tierId ? (
              <Link
                href={`/booking?vehicle=${vehicle.id}&tier=${tierId}`}
                className="group/btn inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-white shadow-sm shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-md hover:shadow-[var(--accent)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
              >
                Book Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5" aria-hidden="true" />
              </Link>
            ) : (
              <span className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[var(--muted)] px-4 text-sm font-semibold text-[var(--muted-foreground)]">
                Enquire
              </span>
            )}

            <Link
              href={`/cars/${vehicle.id}`}
              aria-label={`View details for ${title}`}
              className="inline-flex min-h-[46px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/60 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}