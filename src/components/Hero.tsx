import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, CalendarDays, Search } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--background)] pb-32 pt-28 sm:pb-40 sm:pt-36">
      {/* Spotlight backdrop */}
      <div className="pointer-events-none absolute inset-0">
        {/* soft gold glow from above */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(201,162,39,0.18),transparent)]" />

        {/* fleet photo */}
        <Image
          src="/hero-fleet.jpg"
          alt=""
          fill
          priority
          className="object-cover object-bottom opacity-60"
        />

        {/* fade image into background so text stays readable */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-[var(--background)]/20" />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
        <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-[var(--foreground)] sm:text-6xl">
          Your Car, Every Month
          <span className="block text-[var(--accent)]">No Strings Attached</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--foreground)]/70">
          Flexible 1, 3, 6 or 12 month plans. Home delivery across Dubai.
          No long-term commitment, no hidden fees.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/cars"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white transition hover:opacity-90"
          >
            Browse Fleet
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
          >
            How It Works
          </Link>
        </div>
      </div>

      {/* Floating booking bar — overlaps the bottom edge of the hero */}
      <div className="relative z-20 mx-auto mt-16 max-w-4xl px-4">
        <form className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 p-4 shadow-xl backdrop-blur sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end sm:gap-3 sm:p-5">
          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-xs font-medium text-[var(--foreground)]/60">
              Pick-up city
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--foreground)]/40" />
              <select className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none">
                <option>Dubai Marina</option>
                <option>Downtown Dubai</option>
                <option>Dubai Airport (DXB)</option>
                <option>Business Bay</option>
              </select>
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-xs font-medium text-[var(--foreground)]/60">
              Rental length
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
              <select className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none">
                <option>1 month</option>
                <option>3 months</option>
                <option>6 months</option>
                <option>12 months</option>
              </select>
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-xs font-medium text-[var(--foreground)]/60">
              Start date
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-[var(--foreground)]/40" />
              <input
                type="date"
                className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none [color-scheme:dark]"
              />
            </span>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:h-full"
          >
            <Search className="h-4 w-4" />
            Search Cars
          </button>
        </form>
      </div>
    </section>
  );
}