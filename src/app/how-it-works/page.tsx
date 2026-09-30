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
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

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
    text: 'KYC, agreement, condition reports, and damage claims — all online with photo upload.',
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
        {/* Hero */}
        <section className="border-b border-[var(--border)] bg-[var(--muted)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              How it works
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Your car, every month — in six simple steps
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
              Dubai Monthly Cars is built for flexible long-term driving. No daily
              rental hassle — choose a plan, verify once, and drive with clear
              pricing in AED.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cars"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Browse fleet
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-sm font-semibold transition hover:bg-[var(--muted)]"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">From browse to drive</h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Everything happens in the app — booking, documents, payments, and
              support.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                    <step.icon className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <span className="text-sm font-bold text-[var(--muted-foreground)]">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tiers */}
        <section className="border-y border-[var(--border)] bg-[var(--muted)]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold sm:text-3xl">Pricing tiers</h2>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Same car, different packages — mileage, insurance, and delivery
                change with the tier you pick.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-2xl border p-6 ${
                    tier.highlight
                      ? 'border-[var(--accent)] bg-[var(--card)] shadow-md ring-1 ring-[var(--accent)]/30'
                      : 'border-[var(--border)] bg-[var(--card)]'
                  }`}
                >
                  {tier.highlight && (
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                      Most popular
                    </p>
                  )}
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <ul className="mt-4 space-y-3">
                    {tier.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
              Exact prices are shown on each car page in AED, including deposit.
            </p>
          </div>
        </section>

        {/* Perks */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Why monthly with us</h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Built for expats, professionals, and anyone who wants a car without
              buying one.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <perk.icon className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <h3 className="mt-4 font-semibold">{perk.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {perk.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-[var(--border)] bg-[var(--muted)]">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-10 space-y-4">
              {faqs.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
                >
                  <h3 className="font-semibold">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Car className="h-7 w-7 text-[var(--accent)]" />
          </div>
          <h2 className="mt-6 text-2xl font-bold sm:text-3xl">
            Ready to get your monthly car?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted-foreground)]">
            Browse available cars, compare tiers, and complete booking in minutes.
          </p>
          <Link
            href="/cars"
            className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3.5 text-base font-semibold text-white transition hover:opacity-90"
          >
            View available cars
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </main>
    </div>
  )
}