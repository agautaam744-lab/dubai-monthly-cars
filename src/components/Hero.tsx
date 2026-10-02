"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, CalendarDays, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[100svh] -mt-16 overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(201,162,39,0.22),transparent_70%)]" />

        <Image
          src="/hero-fleet.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-70 animate-scale-in"
        />

        <div className="cinematic-overlay absolute inset-0 z-10" />
      </div>

      <div className="relative z-20 mx-auto flex min-h-[100svh] max-w-6xl flex-col items-center justify-center px-4 pt-24 pb-40 text-center sm:pt-28">
        <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
          <span className="block animate-fade-up">{t("hero.title1")}</span>
          <span className="block animate-fade-up animate-delay-1 text-[var(--accent)]">
            {t("hero.title2")}
          </span>
        </h1>

        <p className="mt-8 max-w-2xl animate-fade-up animate-delay-2 text-lg leading-relaxed text-white/80 sm:text-xl">
          {t("hero.subtitle")}
        </p>

        <div className="mt-12 flex animate-fade-up animate-delay-3 flex-col gap-4 sm:flex-row">
          <Link
            href="/cars"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            {t("hero.browse")}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
          <Link
            href="/how-it-works"
            className="glass inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
          >
            {t("hero.howItWorks")}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-30 mx-auto max-w-5xl animate-fade-up animate-delay-4 px-4">
        <form className="glass grid gap-3 rounded-2xl p-4 shadow-2xl sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end sm:p-5">
          <label className="flex flex-col gap-1.5 text-start">
            <span className="text-xs font-medium text-white/70">{t("hero.pickupCity")}</span>
            <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-white/50" />
              <select className="w-full bg-transparent text-sm text-white outline-none">
                <option className="text-black">{t("hero.cityMarina")}</option>
                <option className="text-black">{t("hero.cityDowntown")}</option>
                <option className="text-black">{t("hero.cityAirport")}</option>
                <option className="text-black">{t("hero.cityBusinessBay")}</option>
              </select>
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-start">
            <span className="text-xs font-medium text-white/70">{t("hero.rentalLength")}</span>
            <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5">
              <select className="w-full bg-transparent text-sm text-white outline-none">
                <option className="text-black">{t("hero.month1")}</option>
                <option className="text-black">{t("hero.month3")}</option>
                <option className="text-black">{t("hero.month6")}</option>
                <option className="text-black">{t("hero.month12")}</option>
              </select>
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-start">
            <span className="text-xs font-medium text-white/70">{t("hero.startDate")}</span>
            <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-white/50" />
              <input
                type="date"
                className="w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]"
              />
            </span>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 sm:h-full"
          >
            <Search className="h-4 w-4" />
            {t("hero.search")}
          </button>
        </form>
      </div>
    </section>
  );
}
