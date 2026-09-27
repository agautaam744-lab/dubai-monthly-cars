'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { adminLogin } from './actions'

const initialState: { error: string | null } = { error: null }

export default function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(
    adminLogin,
    initialState
  )

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium">Admin Email</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            name="email"
            type="email"
            placeholder="admin@example.com"
            required
            autoComplete="email"
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            name="password"
            type="password"
            placeholder="password"
            required
            autoComplete="current-password"
            className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 text-sm font-bold text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Sign in to Admin Panel
          </>
        )}
      </button>

      <div className="border-t border-[var(--border)] pt-4 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] transition hover:text-[var(--accent)]"
        >
          Not an admin? Go to customer login
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </form>
  )
}
