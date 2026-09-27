import { CarFront } from 'lucide-react'

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {/* Logo / Loader */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)]/10" />

          <div className="absolute inset-2 animate-pulse rounded-3xl border border-[var(--accent)]/30 bg-[var(--accent)]/5" />

          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/20">
            <CarFront
              className="h-8 w-8 text-[var(--accent-foreground)]"
              strokeWidth={2}
            />
          </div>
        </div>

        {/* Brand */}
        <h1 className="mt-7 text-xl font-bold tracking-tight">
          Dubai Monthly Cars
        </h1>

        {/* Loading text */}
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Preparing your ride...
        </p>

        {/* Progress dots */}
        <div className="mt-6 flex items-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" />
        </div>
      </div>
    </main>
  )
}