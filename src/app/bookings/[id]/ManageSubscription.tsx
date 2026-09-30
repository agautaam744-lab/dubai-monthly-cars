'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Repeat, CalendarPlus, DoorOpen, ArrowLeftRight, Loader2, CheckCircle2 } from 'lucide-react'
import { toggleAutoRenew, requestBookingChange, type ChangeKind } from '../actions'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ManageSubscription({
  bookingId,
  autoRenew,
  status,
}: {
  bookingId: string
  autoRenew: boolean
  status: string
}) {
  const router = useRouter()
  const { t } = useLanguage()
  const [renew, setRenew] = useState(autoRenew)
  const [saving, setSaving] = useState(false)
  const [kind, setKind] = useState<ChangeKind>('extension')
  const [details, setDetails] = useState('')
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)

  const closed = ['cancelled', 'completed', 'terminated'].includes(status)

  const onToggle = async () => {
    setSaving(true)
    setMsg('')
    const res = await toggleAutoRenew(bookingId, !renew)
    if (res.ok) {
      setRenew(!renew)
    } else {
      setMsg(res.error ?? 'Could not update auto-renewal.')
    }
    setSaving(false)
    router.refresh()
  }

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setMsg('')
    const res = await requestBookingChange(bookingId, kind, details)
    if (res.ok) {
      setMsg(t('sub.requestSent'))
      setDetails('')
    } else {
      setMsg(res.error ?? 'Could not send request.')
    }
    setSending(false)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 lg:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <Repeat className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="font-semibold">{t('sub.title')}</h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-[var(--muted)]/50 p-4">
        <div>
          <p className="text-sm font-semibold">{t('sub.autoRenew')}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {renew ? t('sub.autoRenewOn') : t('sub.autoRenewOff')}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={saving || closed}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : renew ? t('sub.turnOff') : t('sub.turnOn')}
        </button>
      </div>

      {!closed && (
        <form onSubmit={onRequest} className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { v: 'extension', label: t('sub.extend'), icon: CalendarPlus },
                { v: 'termination', label: t('sub.endEarly'), icon: DoorOpen },
                { v: 'swap', label: t('sub.swap'), icon: ArrowLeftRight },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setKind(o.v)}
                className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition ${kind === o.v ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-[var(--border)]'}`}
              >
                <o.icon className="h-3.5 w-3.5" />
                {o.label}
              </button>
            ))}
          </div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            placeholder={
              kind === 'extension'
                ? t('sub.extendPh')
                : kind === 'termination'
                  ? t('sub.endPh')
                  : t('sub.swapPh')
            }
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            required
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border)] px-5 text-sm font-semibold transition hover:bg-[var(--muted)] disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sub.sendRequest')}
          </button>
          {msg && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              {msg}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
