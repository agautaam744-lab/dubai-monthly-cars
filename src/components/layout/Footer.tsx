'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Phone } from 'lucide-react'
import { siteConfig } from '@/lib/site'
import LanguageSwitcher from '@/components/LanguageSwitcher'

// Hidden on staff-only routes: the admin panel has its own chrome.
const HIDDEN_PREFIXES = ['/admin', '/admin-login']

export default function Footer() {
  const pathname = usePathname()

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null
  }

  return (
    <footer
      aria-label="Site footer"
      className="border-t border-[var(--border)] bg-[var(--card)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-lg"
            >
              <Car className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
              <span className="whitespace-nowrap">{siteConfig.brand}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--muted-foreground)]">
              {siteConfig.description}
            </p>
            <a
              href={siteConfig.supportPhoneHref}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <Phone className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              {siteConfig.supportPhoneDisplay}
            </a>
          </div>

          {/* Link groups */}
          {siteConfig.linkGroups.map((group) => (
            <nav key={group.title} aria-label={`Footer — ${group.title}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-1">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-[44px] items-center rounded-lg text-sm text-[var(--muted-foreground)] transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 sm:flex-row">
          <p className="text-center text-xs text-[var(--muted-foreground)] sm:text-left">
            © {new Date().getFullYear()} {siteConfig.brand}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
