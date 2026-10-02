import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const MAX_RETRIES = 3
const LATE_PENALTY_RATE = 0.05 // 5% per overdue month

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
  const results: Array<{
    booking?: string
    payment?: string
    action: string
    next_due?: string
    error?: string
  }> = []

  // ============================================
  // STEP 1: Handle overdue pending payments (late penalty)
  // ============================================

  const { data: overdue } = await supabase
    .from('payments')
    .select('id, booking_id, customer_id, amount_aed, due_date, penalty_aed, retry_count')
    .eq('status', 'pending')
    .lt('due_date', today)
    .lt('retry_count', MAX_RETRIES)

  if (overdue && overdue.length > 0) {
    for (const p of overdue) {
      const currentPenalty = Number(p.penalty_aed ?? 0)
      const newPenalty = currentPenalty === 0
        ? Math.round(Number(p.amount_aed) * LATE_PENALTY_RATE)
        : currentPenalty

      // Increment retry count + apply penalty
      await supabase
        .from('payments')
        .update({
          retry_count: (p.retry_count ?? 0) + 1,
          last_retry_at: new Date().toISOString(),
          penalty_aed: newPenalty,
          failure_reason: 'Payment overdue — retry scheduled',
        })
        .eq('id', p.id)

      // Notify customer
      await supabase.from('notifications').insert({
        user_id: p.customer_id,
        title: 'Payment Overdue',
        body: `Your payment of AED ${Number(p.amount_aed).toLocaleString()} is overdue. A 5% late penalty (AED ${newPenalty}) has been applied.`,
        type: 'payment',
        link: `/payments?booking=${p.booking_id}`,
      })

      results.push({
        payment: p.id,
        action: 'late_penalty_applied',
      })
    }
  }

  // ============================================
  // STEP 2: Charge due bookings (recurring auto-renewal)
  // ============================================

  const { data: dueBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      id,
      customer_id,
      status,
      auto_renew,
      end_date,
      next_due_date,
      months_paid,
      duration_months,
      monthly_price_aed,
      vehicle_id,
      vehicles ( make, model )
    `)
    .eq('status', 'active')
    .eq('auto_renew', true)
    .lte('next_due_date', today)

  if (bookingsError) {
    return NextResponse.json(
      { error: bookingsError.message },
      { status: 500 }
    )
  }

  if (!dueBookings || dueBookings.length === 0) {
    return NextResponse.json({
      processed: results.length,
      results,
      message: 'No due bookings',
    })
  }

  for (const booking of dueBookings) {
    try {
      const monthlyAmount = Number(booking.monthly_price_aed)

      // 1. Create the new payment (marked pending, then succeeded)
      const cycleStart = booking.next_due_date
      const cycleEnd = new Date(cycleStart)
      cycleEnd.setMonth(cycleEnd.getMonth() + 1)
      const cycleEndStr = cycleEnd.toISOString().slice(0, 10)

      const { data: payment, error: payErr } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.id,
          customer_id: booking.customer_id,
          amount_aed: monthlyAmount,
          type: 'monthly_rental',
          status: 'succeeded',
          provider: 'simulated',
          paid_at: new Date().toISOString(),
          due_date: cycleStart,
          billing_cycle_start: cycleStart,
          billing_cycle_end: cycleEndStr,
        })
        .select('id')
        .single()

      if (payErr || !payment) {
        throw new Error(payErr?.message ?? 'Payment insert failed')
      }

      // 2. Compute next due date
      const next = new Date(cycleStart)
      next.setMonth(next.getMonth() + 1)
      const nextDueStr = next.toISOString().slice(0, 10)

      // 3. Check if rental period has ended
      const rentalEnded =
        booking.end_date && nextDueStr > booking.end_date

      // 4. Update booking
      await supabase
        .from('bookings')
        .update({
          next_due_date: rentalEnded ? null : nextDueStr,
          months_paid: (booking.months_paid ?? 0) + 1,
          status: rentalEnded ? 'completed' : 'active',
          end_date: rentalEnded ? cycleEndStr : booking.end_date,
        })
        .eq('id', booking.id)

      // 5. Notify customer
      const vehicleInfo = Array.isArray(booking.vehicles)
        ? booking.vehicles[0]
        : booking.vehicles
      const vehicleName = vehicleInfo
        ? `${vehicleInfo.make} ${vehicleInfo.model}`
        : 'your vehicle'

      await supabase.from('notifications').insert({
        user_id: booking.customer_id,
        title: 'Monthly Payment Received',
        body: `AED ${monthlyAmount.toLocaleString()} was charged for ${vehicleName}. Next payment due: ${nextDueStr}.`,
        type: 'payment',
        link: `/payments?booking=${booking.id}`,
      })

      results.push({
        booking: booking.id,
        payment: payment.id,
        action: rentalEnded ? 'charged_and_completed' : 'charged',
        next_due: rentalEnded ? undefined : nextDueStr,
      })
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Unknown error'

      // Log failure against any pending payments
      await supabase
        .from('bookings')
        .update({
          // Only bump next_due_date if we don't want to retry today
          // For safety, leave it as-is so next cron retries
        })
        .eq('id', booking.id)

      results.push({
        booking: booking.id,
        action: 'charge_failed',
        error: errorMsg,
      })
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
    timestamp: new Date().toISOString(),
  })
}