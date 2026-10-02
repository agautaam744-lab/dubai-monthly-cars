import Link from 'next/link'
import {
  Search,
  FileCheck2,
  CreditCard,
  Car,
  Key,
  Shield,
  Truck,
  Calendar,
  Gauge,
  Headphones,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Browse & Choose',
    description:
      'Explore our fleet of economy, SUV, and luxury cars. Filter by price, transmission, fuel type, and location across Dubai.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Pick Your Plan',
    description:
      'Select Basic, Plus, or Premium. Each tier includes different mileage limits, insurance coverage, and delivery options. Choose 1, 3, 6, or 12 months for multi-month discounts.',
  },
  {
    number: '03',
    icon: FileCheck2,
    title: 'Complete KYC',
    description:
      'Upload your Emirates ID, driving licence, and passport. We verify documents quickly so you can start driving sooner.',
  },
  {
    number: '04',
    icon: CreditCard,
    title: 'Sign & Pay Deposit',
    description:
      'Review the digital rental agreement, sign online, and pay a refundable security deposit plus the first month. Card, Apple Pay, and Google Pay supported.',
  },
  {
    number: '05',
    icon: Truck,
    title: 'Get Your Car',
    description:
      'Choose self pick-up from a hub or home delivery across Dubai. Complete a digital condition report with photos at handover.',
  },
  {
    number: '06',
    icon: Key,
    title: 'Drive Every Month',
    description:
      'Enjoy flexible monthly billing. Extend, swap, or return at the end of your term. Roadside support and damage reporting are built in.',
  },
]

const tiers = [
  {
    name: 'Basic',
    highlight: false,
    points: [
      'Standard mileage limit',
      'Essential insurance',
      'Self pick-up available',
      'Ideal for daily commuting',
    ],
  },
  {
    name: 'Plus',
    highlight: true,
    points: [
      'Higher mileage allowance',
      'Enhanced insurance options',
      'Home delivery included on many cars',
      'Best value for most renters',
    ],
  },
  {
    name: 'Premium',
    highlight: false,
    points: [
      'Highest mileage packages',
      'Zero-excess style coverage options',
      'Priority delivery & support',
      'Luxury and executive vehicles',
    ],
  },
]

const perks = [
  {
    icon: Calendar,
    title: 'Flexible duration',
    text: '1, 3, 6, or 12 month plans with multi-month discounts. No long lock-in beyond your chosen term.',
  },
  {
    icon: Truck,
    title: 'Home delivery',
    text: 'Get the car delivered across Dubai Marina, Downtown, Business Bay, Airport, and more.',
  },
  {
    icon: Shield,
    title: 'Fully insured options',
    text: 'Multiple insurance levels so you can match coverage to your comfort and budget.',
  },
  {
    icon: Gauge,
    title: 'Clear mileage limits',
    text: 'Know your monthly km allowance upfront. Track usage from your dashboard.',
  },
  {
    icon: FileCheck2,
    title: 'Digital paperwork',
    text: 'KYC, agreement, condition reports, and damage claims, all online with photo upload.',
  },
  {
    icon: Headphones,
    title: 'In-app support',
    text: 'Raise tickets, chat with support, and get help for roadside or billing questions.',
  },
]

const faqs = [
  {
    q: 'Who can rent a car monthly?',
    a: 'Residents and visitors with a valid UAE driving licence or International Driving Permit, plus verified Emirates ID / passport as required for KYC.',
  },
  {
    q: 'Is the security deposit refundable?',
    a: 'Yes. The deposit is refundable at the end of the rental after inspection, subject to any approved damage or outstanding charges.',
  },
  {
    q: 'Can I extend or end early?',
    a: 'You can request extension or early termination from your booking. Early termination may involve notice periods and fees as stated in the agreement.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Credit and debit cards, with Apple Pay and Google Pay supported where available. Monthly rent is billed automatically for active subscriptions.',
  },
  {
    q: 'What if the car is damaged?',
    a: 'Use the in-app damage report with photos. We review condition reports at pick-up and return and handle claims against insurance or deposit as applicable.',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1">
        {/* ============================================ */}
        {/* CINEMATIC HERO */}
        {/* ============================================ */}
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.18),transparent)]"
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8 lg:pb-20 lg:pt-24">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              How It Works
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Your car, every month,
              <span className="block text-[var(--accent)]">in six simple steps.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--foreground)]/70 sm:text-lg">
              Dubai Monthly Cars is built for flexible long-term driving. No daily rental hassle — choose a plan, verify once, and drive with clear pricing in AED.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cars"
                className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--accent)]/30"
              >
                Browse fleet
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-7 text-base font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* STEPS TIMELINE */}
        {/* ============================================ */}
        <section className="relative px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center sm:mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                The Journey
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
                From browse to drive
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
                Everything happens in the app — booking, documents, payments, and support.
              </p>
            </div>

            <div className="relative space-y-6">
              {/* Vertical line */}
              <div
                aria-hidden="true"
                className="absolute left-[27px] top-3 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-[var(--accent)]/40 via-[var(--border)] to-transparent md:block"
              />

              {steps.map((step, idx) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.number}
                    className="group relative flex gap-6 md:gap-8"
                  >
                    {/* Circle */}
                    <div className="hidden shrink-0 md:block">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[var(--accent)]/30 bg-[var(--card)] shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[var(--accent)] group-hover:shadow-lg group-hover:shadow-[var(--accent)]/20">
                        <span className="font-serif text-xl font-bold text-[var(--accent)]">
                          {step.number}
                        </span>
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex-1 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5 sm:p-8">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10 md:hidden">
                          <Icon className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-serif text-4xl leading-none text-[var(--accent)]/15 md:hidden">
                              {step.number}
                            </span>
                            <h3 className="font-serif text-2xl tracking-tight sm:text-3xl">
                              {step.title}
                            </h3>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[var(--foreground)]/70 sm:text-base">
                            {step.description}
                          </p>
                        </div>

                        <Icon
                          className="hidden h-6 w-6 shrink-0 text-[var(--accent)]/40 transition-colors group-hover:text-[var(--accent)] md:block"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* PRICING TIERS */}
        {/* ============================================ */}
        <section className="relative overflow-hidden border-y border-[var(--border)] bg-[var(--muted)]/50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(201,162,39,0.06),transparent_70%)]"
          />

          <div className="relative mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Pricing Tiers
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
                Same car, different packages
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--foreground)]/70">
                Mileage, insurance, and delivery change with the tier you pick.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`group relative overflow-hidden rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1.5 ${
                    tier.highlight
                      ? 'border-[var(--accent)] bg-[var(--card)] shadow-xl shadow-[var(--accent)]/10'
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5'
                  }`}
                >
                  {tier.highlight && (
                    <>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -end-20 -top-20 h-40 w-40 rounded-full bg-[var(--accent)]/15 blur-3xl"
                      />
                      <p className="relative mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Most popular
                      </p>
                    </>
                  )}

                  <h3 className="relative font-serif text-3xl tracking-tight">
                    {tier.name}
                  </h3>

                  <div className="relative my-6 h-px w-full bg-gradient-to-r from-[var(--accent)]/40 via-[var(--border)] to-transparent" />

                  <ul className="relative space-y-3.5">
                    {tier.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-3 text-sm leading-6 text-[var(--foreground)]/80"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
              Exact prices are shown on each car page in AED, including deposit.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* PERKS */}
        {/* ============================================ */}
        <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Why Monthly
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
                Built for Dubai living
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--foreground)]/70">
                For expats, professionals, and anyone who wants a car without buying one.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {perks.map((perk) => {
                const Icon = perk.icon
                return (
                  <div
                    key={perk.title}
                    className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-lg hover:shadow-[var(--accent)]/5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 font-serif text-lg tracking-tight">
                      {perk.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/70">
                      {perk.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FAQ (native details/summary) */}
        {/* ============================================ */}
        <section className="relative overflow-hidden border-y border-[var(--border)] bg-[var(--muted)]/50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center sm:mb-14">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Questions
              </p>
              <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
                Frequently asked
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-all hover:border-[var(--accent)]/40"
                >
                  <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-semibold transition hover:text-[var(--accent)] sm:px-6">
                    <span>{item.q}</span>
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-[var(--muted-foreground)] transition-transform duration-300 group-open:rotate-180 group-open:text-[var(--accent)]"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="border-t border-[var(--border)] px-5 py-4 text-sm leading-7 text-[var(--foreground)]/70 sm:px-6">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FINAL CTA */}
        {/* ============================================ */}
        <section className="relative overflow-hidden px-4 py-20 text-center sm:py-24 lg:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(201,162,39,0.12),transparent_70%)]"
          />
          <div className="relative mx-auto max-w-3xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
              <Car className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <h2 className="mt-7 font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
              Ready to get your monthly car?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--foreground)]/70">
              Browse available cars, compare tiers, and complete booking in minutes.
            </p>
            <Link
              href="/cars"
              className="group mt-9 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-8 text-base font-semibold text-white shadow-xl shadow-[var(--accent)]/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[var(--accent)]/40"
            >
              View available cars
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}