"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, MapPin, CalendarDays, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CITY_VALUES = [
  "Dubai Marina",
  "Downtown Dubai",
  "Dubai Airport (DXB)",
  "Business Bay",
];

export default function Hero() {
  const { t } = useLanguage();
  const router = useRouter();
  const [city, setCity] = useState(CITY_VALUES[0]);
  const [months, setMonths] = useState("1");
  const [startDate, setStartDate] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("location", city);
    router.push(`/cars?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-[var(--background)] pb-32 pt-28 sm:pb-40 sm:pt-36">
      {/* Spotlight backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(201,162,39,0.18),transparent)]" />

        <Image
          src="/hero-fleet.jpg"
          alt=""
          fill
          priority
          className="object-cover object-bottom opacity-60"
        />

        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-[var(--background)]/20" />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
        <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-[var(--foreground)] sm:text-6xl">
          {t("hero.title1")}
          <span className="block text-[var(--accent)]">{t("hero.title2")}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--foreground)]/70">
          {t("hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/cars"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white transition hover:opacity-90"
          >
            {t("hero.browse")}
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
          >
            {t("hero.howItWorks")}
          </Link>
        </div>
      </div>

      {/* Floating booking bar */}
      <div className="relative z-20 mx-auto mt-16 max-w-4xl px-4">
        <form onSubmit={onSearch} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]/95 p-4 shadow-xl backdrop-blur sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end sm:gap-3 sm:p-5">
          <label className="flex flex-col gap-1.5 text-start">
            <span className="text-xs font-medium text-[var(--foreground)]/60">
              {t("hero.pickupCity")}
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--foreground)]/40" />
              <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none">
                <option value={CITY_VALUES[0]}>{t("hero.cityMarina")}</option>
                <option value={CITY_VALUES[1]}>{t("hero.cityDowntown")}</option>
                <option value={CITY_VALUES[2]}>{t("hero.cityAirport")}</option>
                <option value={CITY_VALUES[3]}>{t("hero.cityBusinessBay")}</option>
              </select>
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-start">
            <span className="text-xs font-medium text-[var(--foreground)]/60">
              {t("hero.rentalLength")}
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
              <select value={months} onChange={(e) => setMonths(e.target.value)} className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none">
                <option value="1">{t("hero.month1")}</option>
                <option value="3">{t("hero.month3")}</option>
                <option value="6">{t("hero.month6")}</option>
                <option value="12">{t("hero.month12")}</option>
              </select>
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-start">
            <span className="text-xs font-medium text-[var(--foreground)]/60">
              {t("hero.startDate")}
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-[var(--foreground)]/40" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none [color-scheme:dark]"
              />
            </span>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:h-full"
          >
            <Search className="h-4 w-4" />
            {t("hero.search")}
          </button>
        </form>
      </div>
    </section>
  );
}