import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/Hero'
import { ArrowRight, Shield, Truck, Calendar } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />

        {/* Features */}
        <section className="px-4 py-16 bg-[var(--muted)]">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold text-center mb-12 sm:text-3xl">
              Why Choose Us
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl bg-[var(--card)] p-6 shadow-sm border border-[var(--border)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <Calendar className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Flexible Duration</h3>
                <p className="mt-2 text-[var(--foreground)]/70">
                  Choose 1, 3, 6 or 12 months with multi-month discounts.
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--card)] p-6 shadow-sm border border-[var(--border)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <Truck className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Home Delivery</h3>
                <p className="mt-2 text-[var(--foreground)]/70">
                  Get the car delivered to your doorstep across Dubai.
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--card)] p-6 shadow-sm border border-[var(--border)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <Shield className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Fully Insured</h3>
                <p className="mt-2 text-[var(--foreground)]/70">
                  Multiple insurance tiers including zero-excess options.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-20 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to drive?</h2>
          <p className="mt-4 text-[var(--foreground)]/70">
            Browse our fleet and book your monthly car in minutes.
          </p>
          <Link
            href="/cars"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white hover:opacity-90 transition-opacity min-h-[48px]"
          >
            View Available Cars
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </main>
    </div>
  )
}