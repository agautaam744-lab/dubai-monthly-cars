export default function CarsLoading() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* HEADER SKELETON */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--muted)]" />
          <div className="mt-4 h-12 w-64 animate-pulse rounded-xl bg-[var(--muted)] sm:h-14 sm:w-96" />
          <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded-lg bg-[var(--muted)]" />
          <div className="mt-8 h-[52px] w-full max-w-2xl animate-pulse rounded-2xl bg-[var(--muted)]" />
        </div>
      </section>

      {/* CATEGORY PILLS SKELETON */}
      <div className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl gap-2 px-4 py-4 sm:px-6 lg:px-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 animate-pulse rounded-full bg-[var(--muted)]"
            />
          ))}
        </div>
      </div>

      {/* GRID SKELETON */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Filter skeleton */}
          <aside className="hidden h-fit rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 lg:block">
            <div className="h-6 w-24 animate-pulse rounded bg-[var(--muted)]" />
            <div className="mt-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="h-11 w-full animate-pulse rounded-xl bg-[var(--muted)]" />
                </div>
              ))}
            </div>
          </aside>

          <div>
            {/* Toolbar skeleton */}
            <div className="mb-6 flex items-center justify-between">
              <div className="h-5 w-32 animate-pulse rounded bg-[var(--muted)]" />
              <div className="h-11 w-40 animate-pulse rounded-xl bg-[var(--muted)]" />
            </div>

            {/* Cards skeleton */}
            <div className="grid gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
                >
                  <div className="aspect-[16/10] animate-pulse bg-[var(--muted)]" />
                  <div className="space-y-3 p-5">
                    <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--muted)]" />
                    <div className="h-7 w-32 animate-pulse rounded bg-[var(--muted)]" />
                    <div className="flex gap-2">
                      <div className="h-7 w-20 animate-pulse rounded-full bg-[var(--muted)]" />
                      <div className="h-7 w-24 animate-pulse rounded-full bg-[var(--muted)]" />
                      <div className="h-7 w-16 animate-pulse rounded-full bg-[var(--muted)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-11 animate-pulse rounded-xl bg-[var(--muted)]" />
                      <div className="h-11 animate-pulse rounded-xl bg-[var(--muted)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}