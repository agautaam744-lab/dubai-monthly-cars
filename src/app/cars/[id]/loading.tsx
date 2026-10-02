export default function CarDetailLoading() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--muted)]" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* LEFT */}
          <div>
            <div className="aspect-[16/10] animate-pulse rounded-3xl bg-[var(--muted)]" />

            {/* Spec cards */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <div className="h-5 w-5 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="mt-3 h-3 w-12 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="mt-2 h-5 w-16 animate-pulse rounded bg-[var(--muted)]" />
                </div>
              ))}
            </div>

            {/* Fuel policy skeleton */}
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="h-5 w-32 animate-pulse rounded bg-[var(--muted)]" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--muted)]" />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--muted)]" />
            <div className="mt-3 h-12 w-3/4 animate-pulse rounded-xl bg-[var(--muted)]" />
            <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-[var(--muted)]" />

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="h-5 w-48 animate-pulse rounded bg-[var(--muted)]" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--muted)]" />
              </div>
            </div>

            <div className="mt-8">
              <div className="h-8 w-48 animate-pulse rounded bg-[var(--muted)]" />
              <div className="mt-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
                  >
                    <div className="h-7 w-32 animate-pulse rounded bg-[var(--muted)]" />
                    <div className="mt-3 h-9 w-40 animate-pulse rounded bg-[var(--muted)]" />
                    <div className="mt-5 space-y-3">
                      <div className="h-4 w-full animate-pulse rounded bg-[var(--muted)]" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--muted)]" />
                      <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--muted)]" />
                    </div>
                    <div className="mt-5 h-12 w-full animate-pulse rounded-xl bg-[var(--muted)]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}