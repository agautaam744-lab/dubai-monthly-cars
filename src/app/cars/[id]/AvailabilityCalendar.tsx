function toDayString(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function AvailabilityCalendar({
  bookings,
}: {
  bookings: Array<{ start_date: string; end_date: string | null; status: string }>
}) {
  const days: Array<{ date: Date; label: string; booked: boolean }> = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const ranges = bookings
    .filter((b) => !['cancelled', 'completed', 'terminated'].includes(String(b.status)))
    .map((b) => ({
      start: String(b.start_date).slice(0, 10),
      end: b.end_date ? String(b.end_date).slice(0, 10) : String(b.start_date).slice(0, 10),
    }))

  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const key = toDayString(d)
    const booked = ranges.some((r) => r.start <= key && key <= r.end)
    days.push({
      date: d,
      label: d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }),
      booked,
    })
  }

  const bookedCount = days.filter((d) => d.booked).length

  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Availability — next 60 days</h3>
        <span className="text-xs text-[var(--muted-foreground)]">
          {bookedCount === 0 ? 'Free all 60 days' : `${bookedCount} day${bookedCount > 1 ? 's' : ''} booked`}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {days.map((d) => (
          <div
            key={d.date.toISOString()}
            title={`${d.label} — ${d.booked ? 'Booked' : 'Available'}`}
            className={`rounded-lg px-1 py-2 text-center text-[10px] font-medium ${
              d.booked ? 'bg-red-500/15 text-red-500' : 'bg-green-500/10 text-green-600'
            }`}
          >
            {d.label}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Booked
        </span>
      </div>
    </div>
  )
}
