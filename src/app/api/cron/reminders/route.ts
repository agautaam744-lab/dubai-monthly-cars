import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function daysBetween(a: string, b: string) {
  const ms = new Date(a).getTime() - new Date(b).getTime()
  return Math.ceil(ms / 86400000)
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().slice(0, 10)
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)
  const results: Array<{ kind: string; count: number }> = []

  // 1. Payment due in next 3 days -> payment_due reminder
  const { data: duePayments } = await supabase
    .from('payments')
    .select('id, booking_id, customer_id, amount_aed, due_date')
    .eq('status', 'pending')
    .gte('due_date', today)
    .lte('due_date', in3)

  let paymentReminded = 0
  for (const p of duePayments ?? []) {
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', p.customer_id)
      .eq('is_read', false)
      .eq('type', 'payment_due')
      .eq('link', `/payments?booking=${p.booking_id}`)
      .limit(1)
      .maybeSingle()
    if (existing) continue

    await supabase.from('notifications').insert({
      user_id: p.customer_id,
      title: `Payment of AED ${p.amount_aed} due ${p.due_date}`,
      body: 'Pay on time to avoid late fees and service interruption.',
      type: 'payment_due',
      link: `/payments?booking=${p.booking_id}`,
    })
    paymentReminded++
  }
  results.push({ kind: 'payment_due', count: paymentReminded })

  // 2. Active bookings ending in next 7 days -> renewal reminder
  const { data: ending } = await supabase
    .from('bookings')
    .select('id, customer_id, end_date')
    .eq('status', 'active')
    .gte('end_date', today)
    .lte('end_date', in7)

  let renewalReminded = 0
  for (const b of ending ?? []) {
    const daysLeft = daysBetween(String(b.end_date), today)
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', b.customer_id)
      .eq('is_read', false)
      .eq('type', 'renewal')
      .eq('link', `/bookings/${b.id}`)
      .limit(1)
      .maybeSingle()
    if (existing) continue

    await supabase.from('notifications').insert({
      user_id: b.customer_id,
      title: `Rental ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
      body: `Booking ends ${b.end_date}. Extend now to keep the same car.`,
      type: 'renewal',
      link: `/bookings/${b.id}`,
    })
    renewalReminded++
  }
  results.push({ kind: 'renewal', count: renewalReminded })

  // 3. Rejected KYC -> document alert
  const { data: rejectedDocs } = await supabase
    .from('documents')
    .select('user_id')
    .eq('status', 'rejected')
    .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString())

  let kycReminded = 0
  const seen = new Set<string>()
  for (const d of rejectedDocs ?? []) {
    if (seen.has(d.user_id)) continue
    seen.add(d.user_id)
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', d.user_id)
      .eq('is_read', false)
      .eq('type', 'document')
      .eq('link', '/kyc')
      .limit(1)
      .maybeSingle()
    if (existing) continue

    await supabase.from('notifications').insert({
      user_id: d.user_id,
      title: 'KYC document rejected',
      body: 'One of your documents was rejected. Re-upload to continue booking.',
      type: 'document',
      link: '/kyc',
    })
    kycReminded++
  }
  results.push({ kind: 'document', count: kycReminded })

  // ============================================
  // 4. VEHICLE INSURANCE EXPIRY ALERTS (admin)
  // ============================================
  const { data: expiringInsurance } = await supabase
    .from('vehicles')
    .select('id, make, model, plate_number, insurance_expiry, insurance_provider, status')
    .in('status', ['available', 'rented'])
    .not('insurance_expiry', 'is', null)
    .lte('insurance_expiry', in60)

  let insuranceAlerts = 0
  for (const v of expiringInsurance ?? []) {
    const days = daysBetween(String(v.insurance_expiry), today)
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['super_admin', 'fleet_manager'])

    for (const admin of admins ?? []) {
      const alertLink = `/admin/fleet/${v.id}`
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', admin.id)
        .eq('is_read', false)
        .eq('type', 'vehicle_insurance_expiry')
        .eq('link', alertLink)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(1)
        .maybeSingle()
      if (existing) continue

      const title =
        days < 0
          ? `⚠️ Insurance EXPIRED: ${v.make} ${v.model}`
          : days <= 30
            ? `🔴 Insurance expires in ${days}d: ${v.make} ${v.model}`
            : `🟠 Insurance expires in ${days}d: ${v.make} ${v.model}`

      await supabase.from('notifications').insert({
        user_id: admin.id,
        title,
        body: `${v.make} ${v.model} (${v.plate_number ?? 'no plate'}) — ${v.insurance_provider ?? 'Provider TBD'} — expires ${v.insurance_expiry}. Renew immediately.`,
        type: 'vehicle_insurance_expiry',
        link: alertLink,
      })
      insuranceAlerts++
    }
  }
  results.push({ kind: 'vehicle_insurance_expiry', count: insuranceAlerts })

  // ============================================
  // 5. VEHICLE REGISTRATION EXPIRY ALERTS
  // ============================================
  const { data: expiringRegistration } = await supabase
    .from('vehicles')
    .select('id, make, model, plate_number, registration_expiry, status')
    .in('status', ['available', 'rented'])
    .not('registration_expiry', 'is', null)
    .lte('registration_expiry', in60)

  let registrationAlerts = 0
  for (const v of expiringRegistration ?? []) {
    const days = daysBetween(String(v.registration_expiry), today)
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['super_admin', 'fleet_manager'])

    for (const admin of admins ?? []) {
      const alertLink = `/admin/fleet/${v.id}`
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', admin.id)
        .eq('is_read', false)
        .eq('type', 'vehicle_registration_expiry')
        .eq('link', alertLink)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(1)
        .maybeSingle()
      if (existing) continue

      const title =
        days < 0
          ? `⚠️ Registration EXPIRED: ${v.make} ${v.model}`
          : days <= 30
            ? `🔴 Registration expires in ${days}d: ${v.make} ${v.model}`
            : `🟠 Registration expires in ${days}d: ${v.make} ${v.model}`

      await supabase.from('notifications').insert({
        user_id: admin.id,
        title,
        body: `${v.make} ${v.model} (${v.plate_number ?? 'no plate'}) — registration expires ${v.registration_expiry}. Renew at RTA.`,
        type: 'vehicle_registration_expiry',
        link: alertLink,
      })
      registrationAlerts++
    }
  }
  results.push({ kind: 'vehicle_registration_expiry', count: registrationAlerts })

  // ============================================
  // 6. AUTO-BLOCK EXPIRED VEHICLES
  // ============================================
  const { data: expired } = await supabase
    .from('vehicles')
    .select('id, make, model')
    .eq('status', 'available')
    .or(`insurance_expiry.lt.${today},registration_expiry.lt.${today}`)

  let autoBlocked = 0
  for (const v of expired ?? []) {
    await supabase
      .from('vehicles')
      .update({ status: 'maintenance' })
      .eq('id', v.id)
    autoBlocked++
  }
  results.push({ kind: 'auto_blocked_expired', count: autoBlocked })

  return NextResponse.json({ ok: true, date: today, results })
}