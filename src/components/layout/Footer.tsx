"use client";

import Link from "next/link";
import { Car, Mail, Phone, MapPin, Globe2, Send, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";
  const year = new Date().getFullYear();

  const copy = {
    description: isAr
      ? "تأجير سيارات شهري فاخر في دبي. خطط مرنة، توصيل إلى المنزل، وبدون التزامات طويلة الأمد."
      : "Premium monthly car rental in Dubai. Flexible plans, home delivery, and no long-term commitment.",
    explore: isAr ? "استكشف" : "Explore",
    legal: isAr ? "القانوني" : "Legal",
    contact: isAr ? "تواصل معنا" : "Contact",
    privacy: isAr ? "الخصوصية" : "Privacy",
    terms: isAr ? "الشروط والأحكام" : "Terms",
    cookies: isAr ? "ملفات تعريف الارتباط" : "Cookies",
    rights: isAr ? "جميع الحقوق محفوظة." : "All rights reserved.",
    madeIn: isAr ? "صُنع في الإمارات" : "Made in UAE",
    address: isAr ? "دبي، الإمارات العربية المتحدة" : "Dubai, United Arab Emirates",
  };

  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)] bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(201,162,39,0.06),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-serif text-xl font-bold tracking-tight">
              <Car className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
              Dubai Monthly Cars
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--foreground)]/70">
              {copy.description}
            </p>

            <div className="mt-6 flex gap-3">
              <a href="https://instagram.com/dubaimonthlycars" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground)]/70 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <Globe2 className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="https://twitter.com/dubaimonthlycar" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground)]/70 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <Send className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="https://linkedin.com/company/dubai-monthly-cars" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground)]/70 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)]">
                <User className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {copy.explore}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/cars" className="text-sm text-[var(--foreground)]/70 transition hover:text-[var(--accent)]">
                  {t("navbar.browseCars")}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm text-[var(--foreground)]/70 transition hover:text-[var(--accent)]">
                  {t("navbar.howItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="text-sm text-[var(--foreground)]/70 transition hover:text-[var(--accent)]">
                  {t("navbar.myBookings")}
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-[var(--foreground)]/70 transition hover:text-[var(--accent)]">
                  {t("navbar.support")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {copy.legal}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-[var(--foreground)]/70 transition hover:text-[var(--accent)]">
                  {copy.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-[var(--foreground)]/70 transition hover:text-[var(--accent)]">
                  {copy.terms}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-[var(--foreground)]/70 transition hover:text-[var(--accent)]">
                  {copy.cookies}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {copy.contact}
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3 text-sm text-[var(--foreground)]/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                <span>{copy.address}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[var(--foreground)]/70">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                <a href="mailto:support@dubaimonthlycars.ae" className="transition hover:text-[var(--accent)]">
                  support@dubaimonthlycars.ae
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-[var(--foreground)]/70">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                <a href="tel:+97143334444" className="transition hover:text-[var(--accent)]" dir="ltr">
                  +971 4 333 4444
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 sm:flex-row">
          <p className="text-xs text-[var(--foreground)]/50">
            {year} Dubai Monthly Cars. {copy.rights}
          </p>
          <p className="text-xs text-[var(--foreground)]/50">{copy.madeIn}</p>
        </div>
      </div>
    </footer>
  );
}