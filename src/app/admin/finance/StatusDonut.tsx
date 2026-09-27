'use client'

type Slice = {
  label: string
  value: number
  color: string
}

export default function StatusDonut({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const radius = 60
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <h2 className="mb-6 font-semibold">Payment Status</h2>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--muted)" strokeWidth="20" />
            {total > 0 &&
              slices.map((slice, i) => {
                const percent = slice.value / total
                const dash = percent * circumference
                const el = (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="20"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 80 80)"
                  />
                )
                offset += dash
                return el
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Total</p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="flex-1 text-sm">{slice.label}</span>
              <span className="text-sm font-bold">{slice.value}</span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}