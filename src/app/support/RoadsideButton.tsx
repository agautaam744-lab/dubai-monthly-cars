'use client'

import { useState } from 'react'
import { Siren, Loader2, Phone } from 'lucide-react'
import { createTicket } from './actions'
import { useLanguage } from '@/contexts/LanguageContext'

export default function RoadsideButton({ bookingId }: { bookingId?: string }) {
  const { t } = useLanguage()
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState('')

  const request = async () => {
    if (!confirm(t('roadside.confirm'))) return
    setSending(true)
    setDone('')
    const res = await createTicket({
      subject: `Roadside assistance${bookingId ? ` — Booking #${bookingId.slice(0, 8).toUpperCase()}` : ''}`,
      message: `URGENT roadside assistance requested${bookingId ? ` for booking ${bookingId}` : ''}. Customer needs immediate help (breakdown/accident). Please call back ASAP.`,
      priority: 'urgent',
    })
    setDone(res.ok ? t('roadside.done') : (res.error ?? 'Failed. Please call support directly.'))
    setSending(false)
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={request}
        disabled={sending}
        className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />}
        {t('roadside.request')}
      </button>
      <a
        href="tel:+9718000000"
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold"
      >
        <Phone className="h-4 w-4" />
        {t('roadside.call')}
      </a>
      {done && <p className="text-xs text-[var(--muted-foreground)] sm:basis-full">{done}</p>}
    </div>
  )
}
