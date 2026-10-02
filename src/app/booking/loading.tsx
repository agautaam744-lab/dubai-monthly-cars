export default function BookingLoading() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--muted)]" />
          <div className="mt-4 h-12 w-72 animate-pulse rounded-xl bg-[var(--muted)] sm:h-14 sm:w-96" />
          <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded-lg bg-[var(--muted)]" />

          <div className="mt-8 flex flex-wrap gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-7 w-7 animate-pulse rounded-full bg-[var(--muted)]" />
                <div className="h-4 w-16 animate-pulse rounded bg-[var(--muted)]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:px-8 lg:py-14">
        {/* LEFT */}
        <div className="space-y-10">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-[var(--muted)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-7 w-48 animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-4 w-64 animate-pulse rounded bg-[var(--muted)]" />
              </div>
            </div>
          </div>

          {/* Step sections */}
          {[...Array(3)].map((_, s) => (
            <div key={s}>
              <div className="h-3 w-16 animate-pulse rounded bg-[var(--muted)]" />
              <div className="mt-3 h-9 w-56 animate-pulse rounded bg-[var(--muted)]" />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
                  >
                    <div className="h-6 w-24 animate-pulse rounded bg-[var(--muted)]" />
                    <div className="mt-3 h-8 w-32 animate-pulse rounded bg-[var(--muted)]" />
                    <div className="mt-5 space-y-3">
                      <div className="h-4 w-full animate-pulse rounded bg-[var(--muted)]" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--muted)]" />
                      <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--muted)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — Summary */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
            <div className="bg-gradient-to-br from-[var(--primary)] to-black p-5">
              <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
            </div>
            <div className="space-y-5 p-5">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-16 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="mt-2 h-5 w-32 animate-pulse rounded bg-[var(--muted)]" />
                </div>
              ))}
              <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                <div className="h-3 w-32 animate-pulse rounded bg-[var(--muted)]" />
                <div className="mt-2 h-9 w-40 animate-pulse rounded bg-[var(--muted)]" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}