import { createClient } from '@/lib/supabase/server'

export type NotifyType =
  | 'booking'
  | 'payment'
  | 'payment_due'
  | 'kyc'
  | 'document'
  | 'renewal'
  | 'mileage'
  | 'reminder'

type NotifyInput = {
  userId: string
  title: string
  body?: string
  type?: NotifyType
  link?: string
  // Dedupe: skip if an unread notification with same type+link exists
  dedupeKey?: string
}

function getServerClient() {
  return createClient()
}

/**
 * Central helper to create an in-app notification.
 * Safe to call from any server action / API route.
 * Uses dedupe to avoid spamming the same reminder daily.
 */
export async function notify(input: NotifyInput) {
  const supabase = await getServerClient()

  if (input.dedupeKey) {
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', input.userId)
      .eq('is_read', false)
      .eq('type', input.type ?? 'reminder')
      .eq('link', input.link ?? '')
      .limit(1)
      .maybeSingle()

    if (existing) return { ok: true as const, deduped: true as const }
  }

  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    body: input.body ?? null,
    type: input.type ?? 'reminder',
    link: input.link ?? null,
  })

  if (error) return { ok: false as const, error: error.message }

  // Fire-and-forget WhatsApp hook (optional provider).
  // Set WHATSAPP_WEBHOOK_URL + WHATSAPP_TOKEN in env to enable.
  // No-op when not configured, so free-tier MVP keeps working.
  void sendWhatsAppHook(input).catch(() => {})

  return { ok: true as const, deduped: false as const }
}

async function sendWhatsAppHook(input: NotifyInput) {
  const url = process.env.WHATSAPP_WEBHOOK_URL
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.WHATSAPP_TOKEN
        ? { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
    }),
  })
}

/** Mileage alert: called when usage crosses 80% / 100% of monthly cap. */
export async function notifyMileage(opts: {
  userId: string
  bookingId: string
  usedKm: number
  limitKm: number
}) {
  const pct = Math.round((opts.usedKm / Math.max(opts.limitKm, 1)) * 100)
  const over = opts.usedKm >= opts.limitKm
  return notify({
    userId: opts.userId,
    title: over ? 'Mileage limit reached' : `Mileage at ${pct}% of limit`,
    body: over
      ? `You used ${opts.usedKm.toLocaleString()} of ${opts.limitKm.toLocaleString()} km. Extra km charges may apply.`
      : `You used ${opts.usedKm.toLocaleString()} of ${opts.limitKm.toLocaleString()} km (${pct}%). Plan your trips.`,
    type: 'mileage',
    link: `/bookings/${opts.bookingId}`,
    dedupeKey: `mileage-${opts.bookingId}-${over ? 'over' : 'warn'}`,
  })
}

/** Renewal reminder: booking ends in N days. */
export async function notifyRenewal(opts: {
  userId: string
  bookingId: string
  endDate: string
  daysLeft: number
}) {
  return notify({
    userId: opts.userId,
    title:
      opts.daysLeft <= 0
        ? 'Rental period ended'
        : `Rental ends in ${opts.daysLeft} day${opts.daysLeft > 1 ? 's' : ''}`,
    body: `Booking ends ${opts.endDate}. Extend now to keep the same car and avoid re-KYC.`,
    type: 'renewal',
    link: `/bookings/${opts.bookingId}`,
    dedupeKey: `renewal-${opts.bookingId}-${opts.daysLeft}`,
  })
}

/** Payment due reminder. */
export async function notifyPaymentDue(opts: {
  userId: string
  bookingId: string
  amountAed: number
  dueDate: string
}) {
  return notify({
    userId: opts.userId,
    title: `Payment of AED ${opts.amountAed} due ${opts.dueDate}`,
    body: 'Pay on time to avoid late fees and service interruption.',
    type: 'payment_due',
    link: `/payments?booking=${opts.bookingId}`,
    dedupeKey: `pay-${opts.bookingId}-${opts.dueDate}`,
  })
}
