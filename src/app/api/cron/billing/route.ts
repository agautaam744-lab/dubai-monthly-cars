import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().slice(0, 10)

  const { data: duePayments, error } = await supabase
    .from('payments')
    .select('id, booking_id, customer_id, amount_aed, due_date')
    .eq('type', 'monthly_rental')
    .eq('status', 'pending')
    .lte('due_date', today)

  if (error || !duePayments) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  const results = []

  for (const p of duePayments) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status, auto_renew, end_date')
      .eq('id', p.booking_id)
      .single()

    if (!booking || booking.status !== 'active' || !booking.auto_renew) {
      results.push({ payment: p.id, action: 'skipped' })
      continue
    }

    await supabase.from('payments')
      .update({ status: 'succeeded', paid_at: new Date().toISOString(), provider: 'simulated' })
      .eq('id', p.id)

    await supabase.from('notifications').insert({
      user_id: p.customer_id,
      title: 'Payment Received',
      body: `Your monthly rental payment of AED ${p.amount_aed} was received.`,
      type: 'payment',
    })

    const next = new Date(p.due_date)
    next.setMonth(next.getMonth() + 1)
    const nextDue = next.toISOString().slice(0, 10)

    if (!booking.end_date || nextDue <= booking.end_date) {
      await supabase.from('payments').insert({
        booking_id: p.booking_id,
        customer_id: p.customer_id,
        amount_aed: p.amount_aed,
        type: 'monthly_rental',
        status: 'pending',
        due_date: nextDue,
      })
    }

    results.push({ payment: p.id, action: 'charged', next_due: nextDue })
  }

  return NextResponse.json({ processed: results.length, results })
}