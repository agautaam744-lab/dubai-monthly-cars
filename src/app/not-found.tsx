'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CarFront,
  Home,
  Search,
} from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-16">
      {/* Background decoration */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]/5 blur-3xl" />

        <div className="absolute -left-20 top-20 h-40 w-40 rounded-full border border-[var(--accent)]/10" />

        <div className="absolute -right-20 bottom-20 h-56 w-56 rounded-full border border-[var(--accent)]/10" />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Icon */}

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
          <CarFront
            className="h-11 w-11 text-[var(--accent)]"
            strokeWidth={1.7}
          />
        </div>

        {/* 404 */}

        <p className="mt-8 text-7xl font-black tracking-tighter text-[var(--accent)] sm:text-8xl">
          404
        </p>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          This road does not exist
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
          The page you are looking for may have moved, been removed,
          or the address may be incorrect.
        </p>

        {/* Actions */}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>

          <Link
            href="/cars"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 text-sm font-semibold transition hover:bg-[var(--muted)]"
          >
            <Search className="h-4 w-4" />
            Browse Cars
          </Link>
        </div>

        {/* Back */}

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>

        {/* Branding */}

        <p className="mt-12 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Dubai Monthly Cars
        </p>
      </div>
    </main>
  )
}