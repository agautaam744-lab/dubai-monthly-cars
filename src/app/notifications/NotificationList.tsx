'use client'

import { useState, useTransition } from 'react'
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
  default: Bell,
}

export default function NotificationList({
  notifications,
}: {
  notifications: Notification[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localItems, setLocalItems] = useState(notifications)

  const unreadCount = localItems.filter((n) => !n.is_read).length

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
      router.push(n.link)
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
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
          <p className="text-sm font-medium">
            You have{' '}
            <span className="font-bold text-[var(--accent)]">
              {unreadCount}
            </span>{' '}
            unread notification{unreadCount > 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)]">
        {localItems.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="mt-4 font-semibold">No notifications yet</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              You&apos;ll see booking updates, payment reminders and alerts here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {localItems.map((n) => {
              const Icon = typeIcons[n.type ?? 'default'] ?? Bell
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={[
                    'flex w-full items-start gap-4 p-4 text-left transition sm:p-5',
                    'hover:bg-[var(--muted)]/50',
                    !n.is_read && 'bg-[var(--accent)]/5',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      n.is_read
                        ? 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                        : 'bg-[var(--accent)]/15 text-[var(--accent)]',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={[
                          'text-sm',
                          n.is_read ? 'font-medium' : 'font-bold',
                        ].join(' ')}
                      >
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                      )}
                    </div>
                    {n.body && (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      {formatTime(n.created_at)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}