export default function TestComponent() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)] animate-pulse">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded bg-[var(--border)]" />
            <div className="h-5 w-24 rounded bg-[var(--border)]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 rounded bg-[var(--border)]" />
            <div className="h-8 w-8 rounded-full bg-[var(--border)]" />
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] lg:block animate-pulse">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-[var(--border)] p-5">
              <div className="h-4 w-16 rounded bg-[var(--border)] mb-3" />
              <div className="h-5 w-20 rounded bg-[var(--border)]" />
              <div className="h-3 w-24 rounded bg-[var(--border)] mt-1" />
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="flex min-h-[44px] items-center gap-3 rounded-xl px-3">
                  <div className="h-4 w-4 rounded bg-[var(--border)]" />
                  <div className="h-4 w-20 rounded bg-[var(--border)]" />
                </div>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 p-6 sm:p-8 animate-pulse">
            <div className="mb-8">
              <div className="h-4 w-32 rounded bg-[var(--border)] mb-2" />
              <div className="h-8 w-48 rounded bg-[var(--border)] mb-2" />
              <div className="h-5 w-64 rounded bg-[var(--border)] max-w-xs" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="h-3 w-20 rounded bg-[var(--border)]" />
                      <div className="mt-2 h-8 w-16 rounded bg-[var(--border)]" />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-[var(--border)]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
                <div className="h-5 w-32 rounded bg-[var(--border)]" />
                <div className="h-4 w-20 rounded bg-[var(--border)]" />
              </div>
              <div className="divide-y divide-[var(--border)]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="h-4 w-32 rounded bg-[var(--border)] mb-1" />
                      <div className="h-3 w-40 rounded bg-[var(--border)]" />
                    </div>
                    <div className="h-4 w-20 rounded bg-[var(--border)]" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </aside>
      </div>
    </div>
  )
}