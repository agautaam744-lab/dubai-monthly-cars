import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/Hero'
import FeaturedCategories from '@/components/FeaturedCategories'
import { ArrowRight, Shield, Truck, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import VehicleCard, { type CarsVehicle } from '@/app/cars/VehicleCard'

export default async function HomePage() {
  const supabase = await createClient()

  const { data } = await supabase
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
        pricing_tiers (id, name, mileage_limit_km, insurance_level, includes_delivery, sort_order)
      )
    `
    )
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(6)

  const vehicles = (data ?? []) as unknown as CarsVehicle[]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />

        <FeaturedCategories />

        {/* FEATURED CARS */}
        {vehicles.length > 0 && (
          <section className="relative px-4 py-20 sm:py-24 lg:py-28">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--background)] to-transparent" />
            <div className="relative mx-auto max-w-7xl">
              <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Featured Fleet
                  </p>
                  <h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
                    Handpicked for you
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--foreground)]/70 sm:text-base">
                    Premium monthly cars ready to drive today. Insurance, delivery, and support included.
                  </p>
                </div>
                <Link
                  href="/cars"
                  className="group inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap text-sm font-semibold text-[var(--accent)] transition hover:opacity-80"
                >
                  View all cars
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* WHY CHOOSE US */}
        <section className="bg-[var(--muted)] px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center sm:mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Why Monthly Rental
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
                Built for Dubai living
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <Calendar className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Flexible Duration</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/70">
                  Choose 1, 3, 6 or 12 months with multi-month discounts.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <Truck className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Home Delivery</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/70">
                  Get the car delivered to your doorstep across Dubai.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <Shield className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Fully Insured</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/70">
                  Multiple insurance tiers including zero-excess options.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden px-4 py-20 text-center sm:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(201,162,39,0.12),transparent_70%)]"
          />
          <div className="relative mx-auto max-w-3xl">
            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
              Ready to drive?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--foreground)]/70 sm:text-base">
              Browse our fleet and book your monthly car in minutes.
            </p>
            <Link
              href="/cars"
              className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-8 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--accent)]/30"
            >
              View Available Cars
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
