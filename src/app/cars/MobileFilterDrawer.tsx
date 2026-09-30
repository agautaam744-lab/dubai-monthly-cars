'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

export default function MobileFilterDrawer({
  activeCount,
  resultsCount,
  children,
}: {
  activeCount: number
  resultsCount: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open ])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
      >
        <SlidersHorizontal className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
        Filters
        {activeCount > 0 && (
          <span
            aria-label={`${activeCount} filters active`}
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-[var(--accent-foreground)]"
          >
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter cars"
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
        >
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50 motion-safe:animate-[fadeIn_150ms_ease-out]"
          />
          <div className="relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[var(--border)] bg-[var(--card)] p-5 pb-8 shadow-2xl motion-safe:animate-[slideUp_200ms_ease-out] sm:rounded-3xl sm:p-6">
            <div
              aria-hidden="true"
              className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--border)]"
            />
            <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-lg font-bold">Filters</h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {resultsCount} car{resultsCount === 1 ? '' : 's'} match
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                autoFocus
                aria-label="Close filters"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--border)] transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  )
}
