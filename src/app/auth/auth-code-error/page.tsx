import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10">
          <AlertCircle className="h-8 w-8 text-[var(--danger)]" />
        </div>

        <h1 className="mt-6 text-2xl font-bold">
          Sign-in could not be completed
        </h1>

        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          The authentication callback was not completed.
          Please try signing in again.
        </p>

        <Link
          href="/login"
          className="mt-7 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)]"
        >
          Back to Login
        </Link>
      </div>
    </main>
  )
}