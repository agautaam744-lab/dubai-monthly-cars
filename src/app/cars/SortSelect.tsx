'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

const OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
] as const

export default function SortSelect({ value }: { value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'newest') {
      params.delete('sort')
    } else {
      params.set('sort', next)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <label className="inline-flex min-h-[48px] flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-medium shadow-sm transition hover:border-[var(--accent)]/40 sm:flex-none">
      <ArrowUpDown className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
      <span className="sr-only">Sort cars</span>
      <select
        value={['price-asc', 'price-desc'].includes(value) ? value : 'newest'}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Sort cars"
        className="w-full cursor-pointer bg-transparent py-2 outline-none"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
