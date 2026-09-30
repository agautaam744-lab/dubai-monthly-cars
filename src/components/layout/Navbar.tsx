'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Menu,
  X,
  Sun,
  Moon,
  Car,
  Globe2,
  ChevronDown,
  Check,
  LayoutDashboard,
  Bell,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useLanguage } from '@/contexts/LanguageContext'
import NotificationBell from './NotificationBell'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const { lang, setLang, t } = useLanguage()

  const languageRef = useRef<HTMLDivElement>(null)

  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setLanguageOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const changeLanguage = (nextLanguage: 'en' | 'ar') => {
    setLang(nextLanguage)
    setLanguageOpen(false)
    setIsOpen(false)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const navLinks = [
    { href: '/cars', label: t('navbar.browseCars') },
    { href: '/how-it-works', label: t('navbar.howItWorks') },
    { href: '/bookings', label: t('navbar.myBookings') },
    { href: '/condition-report', label: t('navbar.conditionReport') },
    { href: '/damage-report', label: t('navbar.damageReport') },
    { href: '/watchlist', label: t('navbar.watchlist') },
    { href: '/support', label: t('navbar.support') },
  ]

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        'border-b border-[var(--border)]',
        'bg-[var(--background)]/95 backdrop-blur-xl',
        'supports-[backdrop-filter]:bg-[var(--background)]/80'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link
          href="/"
          onClick={() => setIsOpen(false)}
          className="flex min-h-[44px] shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <Car
            className="h-6 w-6 shrink-0 text-[var(--accent)]"
            aria-hidden="true"
          />
          <span className="hidden whitespace-nowrap xl:inline">
            Dubai Monthly Cars
          </span>
          <span className="whitespace-nowrap xl:hidden">DMC</span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav
          className="hidden items-center gap-5 lg:flex xl:gap-6"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex min-h-[44px] items-center whitespace-nowrap',
                'text-sm font-medium',
                'text-[var(--foreground)]/75',
                'transition-colors',
                'hover:text-[var(--foreground)]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex shrink-0 items-center gap-2">
          {/* LANGUAGE DROPDOWN (DESKTOP) */}
          <div ref={languageRef} className="relative hidden xl:block">
            <button
              type="button"
              onClick={() =>
                setLanguageOpen((current) => !current)
              }
              className={cn(
                'flex min-h-[44px] items-center gap-2',
                'rounded-lg px-3',
                'text-sm font-medium',
                'text-[var(--foreground)]/85',
                'transition-colors',
                'hover:bg-[var(--muted)]'
              )}
              aria-haspopup="menu"
              aria-expanded={languageOpen}
            >
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              <span className="whitespace-nowrap">
                {lang === 'en' ? 'EN' : 'AR'}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  languageOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>

            {languageOpen && (
              <div
                className={cn(
                  'absolute right-0 top-full mt-2 w-48',
                  'overflow-hidden rounded-xl',
                  'border border-[var(--border)]',
                  'bg-[var(--card)]',
                  'shadow-xl'
                )}
                role="menu"
              >
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => changeLanguage('en')}
                    className={cn(
                      'flex min-h-[44px] w-full',
                      'items-center justify-between',
                      'rounded-lg px-3',
                      'text-sm',
                      'transition-colors',
                      'hover:bg-[var(--muted)]',
                      lang === 'en' && 'bg-[var(--muted)]'
                    )}
                    role="menuitem"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">🇬🇧</span>
                      English
                    </span>
                    {lang === 'en' && (
                      <Check
                        className="h-4 w-4 text-[var(--accent)]"
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => changeLanguage('ar')}
                    className={cn(
                      'flex min-h-[44px] w-full',
                      'items-center justify-between',
                      'rounded-lg px-3',
                      'text-sm',
                      'transition-colors',
                      'hover:bg-[var(--muted)]',
                      lang === 'ar' && 'bg-[var(--muted)]'
                    )}
                    role="menuitem"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">🇦🇪</span>
                      العربية
                    </span>
                    {lang === 'ar' && (
                      <Check
                        className="h-4 w-4 text-[var(--accent)]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* NOTIFICATION BELL (DESKTOP) */}
          {isLoggedIn && (
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
          )}

          {/* PROFILE LINK (DESKTOP) */}
          {isLoggedIn && (
            <Link
              href="/profile"
              className={cn(
                'hidden sm:flex min-h-[44px] min-w-[44px]',
                'items-center justify-center',
                'rounded-lg',
                'text-[var(--foreground)]',
                'transition-colors',
                'hover:bg-[var(--muted)]'
              )}
              aria-label="Profile"
            >
              <User className="h-5 w-5" />
            </Link>
          )}

          {/* THEME TOGGLE (DESKTOP) */}
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              'hidden sm:flex min-h-[44px] min-w-[44px]',
              'items-center justify-center',
              'rounded-lg',
              'text-[var(--foreground)]',
              'transition-colors',
              'hover:bg-[var(--muted)]'
            )}
            aria-label={t('navbar.toggleTheme')}
            title={t('navbar.toggleTheme')}
          >
            {mounted ? (
              theme === 'dark' ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )
            ) : (
              <span className="h-5 w-5 opacity-0" />
            )}
          </button>

          {/* LOGIN / DASHBOARD */}
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className={cn(
                'hidden min-h-[44px] sm:inline-flex',
                'items-center justify-center gap-2 whitespace-nowrap',
                'rounded-xl',
                'bg-[var(--primary)]',
                'px-4 py-2',
                'text-sm font-semibold',
                'text-[var(--primary-foreground)]',
                'shadow-sm',
                'transition-all',
                'hover:opacity-90',
                'active:scale-[0.98]'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden xl:inline">{t('navbar.dashboard')}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className={cn(
                'hidden min-h-[44px] sm:inline-flex',
                'items-center justify-center whitespace-nowrap',
                'rounded-xl',
                'bg-[var(--accent)]',
                'px-5 py-2',
                'text-sm font-semibold',
                'text-[var(--accent-foreground)]',
                'shadow-sm',
                'transition-all',
                'hover:bg-[var(--accent-hover)]',
                'active:scale-[0.98]'
              )}
            >
              {t('navbar.login')}
            </Link>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className={cn(
              'flex lg:hidden',
              'min-h-[44px] min-w-[44px]',
              'items-center justify-center',
              'rounded-lg',
              'text-[var(--foreground)]',
              'transition-colors',
              'hover:bg-[var(--muted)]'
            )}
            aria-label={isOpen ? t('navbar.closeMenu') : t('navbar.openMenu')}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={cn(
          'lg:hidden',
          'border-t border-[var(--border)]',
          'bg-[var(--background)]',
          isOpen ? 'block' : 'hidden'
        )}
      >
        <div className="space-y-2 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex min-h-[48px]',
                'items-center',
                'rounded-lg px-3',
                'text-base font-medium',
                'text-[var(--foreground)]',
                'transition-colors',
                'hover:bg-[var(--muted)]'
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Notifications */}
          {isLoggedIn && (
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex min-h-[48px] items-center gap-3',
                'rounded-lg px-3',
                'text-base font-medium',
                'text-[var(--foreground)]',
                'transition-colors',
                'hover:bg-[var(--muted)]'
              )}
            >
              <Bell className="h-5 w-5" />
              {t('navbar.notifications')}
            </Link>
          )}

          {/* Mobile Profile */}
          {isLoggedIn && (
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex min-h-[48px] items-center gap-3',
                'rounded-lg px-3',
                'text-base font-medium',
                'text-[var(--foreground)]',
                'transition-colors',
                'hover:bg-[var(--muted)]'
              )}
            >
              <User className="h-5 w-5" />
              {t('navbar.profile')}
            </Link>
          )}

          {/* Mobile Language Dropdown */}
          <div className="border-t border-[var(--border)] pt-2">
            <button
              type="button"
              onClick={() =>
                setLanguageOpen((current) => !current)
              }
              className={cn(
                'flex min-h-[48px] w-full',
                'items-center justify-between',
                'rounded-lg px-3',
                'text-base font-medium',
                'text-[var(--foreground)]',
                'transition-colors',
                'hover:bg-[var(--muted)]'
              )}
              aria-expanded={languageOpen}
            >
              <span className="flex items-center gap-3">
                <Globe2 className="h-5 w-5" />
                {lang === 'en' ? 'English' : 'العربية'}
              </span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 transition-transform',
                  languageOpen && 'rotate-180'
                )}
              />
            </button>

            {languageOpen && (
              <div className="mt-1 space-y-1 px-2">
                <button
                  type="button"
                  onClick={() => changeLanguage('en')}
                  className={cn(
                    'flex min-h-[44px] w-full',
                    'items-center justify-between',
                    'rounded-lg px-3',
                    'text-sm',
                    'hover:bg-[var(--muted)]',
                    lang === 'en' && 'bg-[var(--muted)]'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span>🇬🇧</span> English
                  </span>
                  {lang === 'en' && (
                    <Check className="h-4 w-4 text-[var(--accent)]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => changeLanguage('ar')}
                  className={cn(
                    'flex min-h-[44px] w-full',
                    'items-center justify-between',
                    'rounded-lg px-3',
                    'text-sm',
                    'hover:bg-[var(--muted)]',
                    lang === 'ar' && 'bg-[var(--muted)]'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span>🇦🇪</span> العربية
                  </span>
                  {lang === 'ar' && (
                    <Check className="h-4 w-4 text-[var(--accent)]" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Theme Toggle */}
          <div className="border-t border-[var(--border)] pt-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={cn(
                'flex min-h-[48px] w-full',
                'items-center justify-between',
                'rounded-lg px-3',
                'text-base font-medium',
                'text-[var(--foreground)]',
                'transition-colors',
                'hover:bg-[var(--muted)]'
              )}
            >
              <span className="flex items-center gap-3">
                {mounted ? (
                  <>
                    {theme === 'dark' ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                    {theme === 'dark' ? t('navbar.lightMode') : t('navbar.darkMode')}
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 opacity-0" />
                    <span className="opacity-0">{t('navbar.darkMode')}</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Mobile Login / Dashboard */}
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={cn(
                'mt-2 flex min-h-[48px] w-full',
                'items-center justify-center gap-2',
                'rounded-xl',
                'bg-[var(--primary)]',
                'px-4 py-3',
                'text-sm font-semibold',
                'text-[var(--primary-foreground)]',
                'transition-all',
                'hover:opacity-90'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('navbar.dashboard')}
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className={cn(
                'mt-2 flex min-h-[48px] w-full',
                'items-center justify-center',
                'rounded-xl',
                'bg-[var(--accent)]',
                'px-4 py-3',
                'text-sm font-semibold',
                'text-[var(--accent-foreground)]',
                'transition-all',
                'hover:bg-[var(--accent-hover)]'
              )}
            >
              {t('navbar.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
