import Link from 'next/link'
import { ChevronLeft, Cookie } from 'lucide-react'

export const metadata = {
  title: 'Cookie Policy | Dubai Monthly Cars',
}

// NOTE(owner): template content — have it reviewed by UAE legal counsel
// before production launch.
export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 min-h-screen bg-[var(--background)]">
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
          <Cookie className="h-6 w-6 text-[var(--accent)]" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Legal</p>
          <h1 className="text-3xl font-bold">Cookie Policy</h1>
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">Last updated: 2026 · Template — pending legal review.</p>
      <div className="mt-8 space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-semibold">Strictly necessary cookies</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Authentication session cookies (Supabase Auth) keep you signed in, and a language-preference cookie
            remembers your English/Arabic choice. These are required for the site to function and cannot be disabled.
          </p>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-semibold">Preferences</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Theme (light/dark/system) is stored locally in your browser only and is never sent to our servers.
          </p>
        </section>
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-semibold">No advertising trackers</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            We do not use third-party advertising or cross-site tracking cookies. If analytics are added in the
            future, this policy will be updated first.
          </p>
        </section>
      </div>
    </main>
  )
}
