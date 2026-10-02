import Link from "next/link";
import {
  ArrowRight,
  Award,
  Truck,
  ShieldCheck,
  Headphones,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Award,
    title: "Handpicked fleet",
    description:
      "Every car is inspected, certified, and maintained to the highest standard before it reaches your driveway.",
    tag: "Quality assured",
  },
  {
    icon: Truck,
    title: "Door-to-door delivery",
    description:
      "From Business Bay to Dubai Marina — we deliver to your home or office. No showroom visits, no waiting.",
    tag: "Free across Dubai",
  },
  {
    icon: ShieldCheck,
    title: "All-inclusive insurance",
    description:
      "Comprehensive coverage on every plan. Choose our zero-excess upgrade for complete peace of mind.",
    tag: "Fully covered",
  },
  {
    icon: Headphones,
    title: "24/7 concierge support",
    description:
      "Real people, real answers. Roadside assistance and in-app chat, around the clock.",
    tag: "Always available",
  },
];

export default function PremiumExperience() {
  return (
    <section className="relative overflow-hidden bg-[var(--background)] px-4 py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(201,162,39,0.06),transparent)]"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            The Premium Experience
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            More than a rental.
            <br />
            <span className="text-[var(--accent)]">A lifestyle.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--foreground)]/70 sm:text-lg">
            Everything you need to drive — nothing you don&rsquo;t. Premium cars,
            seamless delivery, and support that never sleeps.
          </p>
        </div>

        {/* FEATURES GRID */}
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            const isEven = idx % 2 === 0;
            return (
              <article
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--accent)]/40 hover:shadow-2xl hover:shadow-[var(--accent)]/10 sm:p-8"
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -end-20 -top-20 h-48 w-48 rounded-full bg-gradient-to-br ${
                    isEven
                      ? "from-[var(--accent)]/15 to-transparent"
                      : "from-[var(--accent)]/10 to-transparent"
                  } opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background)]/60 backdrop-blur">
                    <Icon
                      className="h-7 w-7 text-[var(--accent)] transition-transform duration-500 group-hover:scale-110"
                      aria-hidden="true"
                    />
                  </div>

                  <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                    {feature.tag}
                  </span>
                </div>

                <h3 className="relative mt-7 font-serif text-2xl tracking-tight sm:text-3xl">
                  {feature.title}
                </h3>

                <p className="relative mt-3 text-sm leading-6 text-[var(--foreground)]/70 sm:text-base">
                  {feature.description}
                </p>

                <div className="relative mt-6 h-px w-full bg-gradient-to-r from-[var(--border)] via-[var(--border)] to-transparent" />

                <div className="relative mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]/50">
                  Included on every plan
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-[var(--accent)]"
                  />
                  No hidden fees
                </div>
              </article>
            );
          })}
        </div>

        {/* BOTTOM CTA */}
        <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:mt-16 sm:flex-row">
          <Link
            href="/cars"
            className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-8 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--accent)]/30"
          >
            Explore the fleet
            <ArrowRight
              className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-8 text-base font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          >
            How it works
          </Link>
        </div>
      </div>
    </section>
  );
}