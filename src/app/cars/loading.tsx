function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
    >
      <div className="aspect-[16/10] animate-pulse bg-[var(--muted)]" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-[var(--muted)]" />
        <div className="h-9 w-1/2 animate-pulse rounded-lg bg-[var(--muted)]" />
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-[var(--muted)]/60 p-3">
          <div className="h-4 animate-pulse rounded bg-[var(--border)]" />
          <div className="h-4 animate-pulse rounded bg-[var(--border)]" />
          <div className="h-4 animate-pulse rounded bg-[var(--border)]" />
          <div className="h-4 animate-pulse rounded bg-[var(--border)]" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-12 animate-pulse rounded-xl bg-[var(--muted)]" />
          <div className="h-12 animate-pulse rounded-xl bg-[var(--muted)]" />
        </div>
      </div>
    </div>
  )
}

export default function CarsLoading() {
  return (
    <main className="min-h-screen bg-[var(--background)]" aria-busy="true" aria-label="Loading cars">
      <section className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-4 w-40 animate-pulse rounded bg-[var(--border)]" />
          <div className="mt-3 h-9 w-72 max-w-full animate-pulse rounded-lg bg-[var(--border)]" />
          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[var(--border)]" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <p className="sr-only">Loading available cars…</p>
      </section>
    </main>
  )
}
