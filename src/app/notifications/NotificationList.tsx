'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCheck,
  CreditCard,
  FileText,
  Car,
  AlertCircle,
  Loader2,
  Gauge,
  CalendarClock,
  Wallet,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { markAsRead, markAllAsRead } from './actions'

type Notification = {
  id: string
  title: string
  body: string | null
  type: string | null
  is_read: boolean
  link: string | null
  created_at: string
}

const typeIcons: Record<string, LucideIcon> = {
  booking: Car,
  payment: CreditCard,
  payment_due: Wallet,
  kyc: FileText,
  document: FileText,
  renewal: CalendarClock,
  mileage: Gauge,
  reminder: AlertCircle,
  vehicle_insurance_expiry: ShieldCheck,
  vehicle_registration_expiry: ShieldCheck,
  default: Bell,
}

const typeColors: Record<string, string> = {
  booking: 'bg-sky-500/10 text-sky-600',
  payment: 'bg-emerald-500/10 text-emerald-600',
  payment_due: 'bg-amber-500/10 text-amber-600',
  kyc: 'bg-purple-500/10 text-purple-600',
  document: 'bg-purple-500/10 text-purple-600',
  renewal: 'bg-amber-500/10 text-amber-600',
  mileage: 'bg-sky-500/10 text-sky-600',
  reminder: 'bg-red-500/10 text-red-600',
  vehicle_insurance_expiry: 'bg-red-500/10 text-red-600',
  vehicle_registration_expiry: 'bg-red-500/10 text-red-600',
  default: 'bg-[var(--accent)]/10 text-[var(--accent)]',
}

type Filter = 'all' | 'unread'

export default function NotificationList({
  notifications,
}: {
  notifications: Notification[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localItems, setLocalItems] = useState(notifications)
  const [filter, setFilter] = useState<Filter>('all')

  const unreadCount = localItems.filter((n) => !n.is_read).length

  const filteredItems = useMemo(
    () =>
      filter === 'unread'
        ? localItems.filter((n) => !n.is_read)
        : localItems,
    [localItems, filter]
  )

  const handleClick = (n: Notification) => {
    if (!n.is_read) {
      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, is_read: true } : item
        )
      )
      startTransition(async () => {
        await markAsRead(n.id)
      })
    }
    if (n.link) {
      if (n.link === '/' || /^\/[^/\\]/.test(n.link)) {
        router.push(n.link)
      }
    }
  }

  const handleMarkAll = () => {
    setLocalItems((prev) => prev.map((item) => ({ ...item, is_read: true })))
    startTransition(async () => {
      await markAllAsRead()
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* CONTROLS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter tabs */}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 p-1 sm:inline-grid sm:w-auto">
          {(['all', 'unread'] as const).map((f) => {
            const active = filter === f
            const label = f === 'all' ? 'All' : 'Unread'
            const count = f === 'all' ? localItems.length : unreadCount
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={[
                  'flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all',
                  active
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                {label}
                <span
                  className={[
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                    active
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
                  ].join(' ')}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isPending}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {/* LIST */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/20">
            <Bell className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-serif text-2xl tracking-tight">
            {filter === 'unread' ? 'All caught up' : 'No notifications yet'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
            {filter === 'unread'
              ? 'You have no unread notifications. Check back later.'
              : "You'll see booking updates, payment reminders and alerts here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((n) => {
            const Icon = typeIcons[n.type ?? 'default'] ?? Bell
            const iconColor = typeColors[n.type ?? 'default'] ?? typeColors.default

            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={[
                  'group flex w-full items-start gap-4 rounded-2xl border p-5 text-start transition-all hover:-translate-y-0.5 hover:shadow-md',
                  !n.is_read
                    ? 'border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-transparent hover:border-[var(--accent)]/50'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/40',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                    n.is_read ? 'bg-[var(--muted)]/50 text-[var(--muted-foreground)]' : iconColor,
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={[
                        'text-sm leading-6',
                        n.is_read ? 'font-medium' : 'font-bold',
                      ].join(' ')}
                    >
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span
                        aria-label="Unread"
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_var(--accent)]/15"
                      />
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-[var(--foreground)]/70">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-medium text-[var(--muted-foreground)]">
                    {formatTime(n.created_at)}
                  </p>
                </div>

                {n.link && (
                  <ChevronRight
                    className="mt-1 h-5 w-5 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-[var(--accent)] rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Bottom hint */}
      {localItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <p className="text-xs leading-5 text-[var(--muted-foreground)]">
            Notifications are kept for 90 days. For important updates, check your{' '}
            <span className="font-semibold text-[var(--foreground)]">bookings</span> and{' '}
            <span className="font-semibold text-[var(--foreground)]">payments</span> pages.
          </p>
        </div>
      )}
    </div>
  )
}