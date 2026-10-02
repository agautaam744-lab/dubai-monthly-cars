import { Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react'

function toDayString(d: Date) {
  return d.toISOString().slice(0, 10)
}

type Booking = {
  start_date: string
  end_date: string | null
  status: string
}

export default function AvailabilityCalendar({
  bookings,
}: {
  bookings: Booking[]
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = toDayString(today)

  const ranges = bookings
    .filter((b) => !['cancelled', 'completed', 'terminated'].includes(String(b.status)))
    .map((b) => ({
      start: String(b.start_date).slice(0, 10),
      end: b.end_date ? String(b.end_date).slice(0, 10) : String(b.start_date).slice(0, 10),
    }))
    .sort((a, b) => a.start.localeCompare(b.start))

  const days: Array<{ date: Date; key: string; day: number; weekday: string; booked: boolean; isToday: boolean }> = []

  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const key = toDayString(d)
    const booked = ranges.some((r) => r.start <= key && key <= r.end)
    days.push({
      date: d,
      key,
      day: d.getDate(),
      weekday: d.toLocaleDateString('en-AE', { weekday: 'short' }),
      booked,
      isToday: key === todayKey,
    })
  }

  const bookedCount = days.filter((d) => d.booked).length
  const availableCount = days.length - bookedCount

  // Find first available date
  const nextAvailable = days.find((d) => !d.booked)
  const nextAvailableLabel = nextAvailable
    ? nextAvailable.date.toLocaleDateString('en-AE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const availableTone = availableCount === days.length ? 'success' : bookedCount > 30 ? 'danger' : 'warning'

  const toneStyles = {
    success: 'border-emerald-500/30 bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    danger: 'border-red-500/30 bg-red-500/5',
  }

  const toneTextStyles = {
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
  }

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Calendar className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-serif text-xl tracking-tight">
              Availability
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Next 60 days
            </p>
          </div>
        </div>

        <div className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${toneStyles[availableTone]} ${toneTextStyles[availableTone]}`}>
          {bookedCount === 0
            ? 'Free all 60 days'
            : `${availableCount} days free`}
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-3 border-b border-[var(--border)] p-5 sm:grid-cols-3 sm:p-6">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Available
          </div>
          <p className="mt-1.5 font-serif text-2xl tabular-nums tracking-tight text-emerald-700">
            {availableCount}
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-red-700">
            <Clock className="h-3 w-3" aria-hidden="true" />
            Booked
          </div>
          <p className="mt-1.5 font-serif text-2xl tabular-nums tracking-tight text-red-700">
            {bookedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Total window
          </div>
          <p className="mt-1.5 font-serif text-2xl tabular-nums tracking-tight text-[var(--accent)]">
            60 days
          </p>
        </div>
      </div>

      {/* NEXT AVAILABLE CALLOUT */}
      {nextAvailableLabel && (
        <div className="flex items-start gap-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 via-transparent to-transparent p-5 sm:p-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
              Next available from
            </p>
            <p className="mt-1 font-serif text-lg tracking-tight">
              {nextAvailableLabel}
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Book now to secure this rental window
            </p>
          </div>
        </div>
      )}

      {/* CALENDAR GRID */}
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10 lg:grid-cols-15">
          {days.map((d) => (
            <div
              key={d.key}
              title={`${d.date.toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long' })} — ${d.booked ? 'Booked' : 'Available'}`}
              className={[
                'flex flex-col items-center justify-center rounded-xl px-1 py-2 text-center transition-all',
                d.booked
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-emerald-500/10 text-emerald-700',
                d.isToday
                  ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--card)]'
                  : '',
              ].join(' ')}
            >
              <span className="text-[9px] font-medium uppercase tracking-wider opacity-70">
                {d.weekday}
              </span>
              <span className="mt-0.5 text-xs font-bold tabular-nums">
                {d.day}
              </span>
            </div>
          ))}
        </div>

        {/* LEGEND */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
            Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            Today
          </span>
        </div>

        {/* BOOKED RANGES */}
        {ranges.length > 0 && (
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
              Upcoming booked periods
            </p>
            <ul className="mt-3 space-y-1.5">
              {ranges.slice(0, 4).map((r, idx) => {
                const start = new Date(r.start)
                const end = new Date(r.end)
                const startLabel = start.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })
                const endLabel = end.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })
                return (
                  <li
                    key={idx}
                    className="flex items-center gap-3 rounded-lg bg-[var(--muted)]/30 px-3 py-2 text-xs"
                  >
                    <span className="flex h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                    <span className="tabular-nums">
                      {r.start === r.end
                        ? startLabel
                        : `${startLabel} → ${endLabel}`}
                    </span>
                  </li>
                )
              })}
              {ranges.length > 4 && (
                <li className="text-center text-[10px] text-[var(--muted-foreground)]">
                  + {ranges.length - 4} more booked period{ranges.length - 4 > 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}