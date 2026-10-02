import Link from "next/link";
import { ArrowRight, Car, Zap, Crown, Users } from "lucide-react";

type Category = {
  name: string;
  slug: string;
  description: string;
  icon: typeof Car;
  gradient: string;
};

const CATEGORIES: Category[] = [
  {
    name: "Economy",
    slug: "economy",
    description: "Smart, efficient, perfect for daily drives.",
    icon: Car,
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    name: "SUV",
    slug: "suv",
    description: "Spacious, powerful, built for families.",
    icon: Users,
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  {
    name: "Luxury",
    slug: "luxury",
    description: "Premium brands, exceptional presence.",
    icon: Crown,
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  {
    name: "Electric",
    slug: "electric",
    description: "Zero emissions, silent, future-ready.",
    icon: Zap,
    gradient: "from-sky-500/20 to-sky-500/5",
  },
];

export default function FeaturedCategories() {
  return (
    <section className="relative px-4 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Browse by category
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
              Find your fit
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--foreground)]/70 sm:text-base">
              Every lifestyle has a match. Choose your drive.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.slug}
                href={`/cars?category=${category.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--accent)]/40 hover:shadow-2xl hover:shadow-[var(--accent)]/10"
              >
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background)]/60 backdrop-blur">
                    <Icon
                      className="h-7 w-7 text-[var(--accent)] transition-transform duration-500 group-hover:scale-110"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="mt-6 font-serif text-2xl tracking-tight">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/70">
                    {category.description}
                  </p>

                  <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)]">
                    Explore
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}