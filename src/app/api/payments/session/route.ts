import { NextResponse } from 'next/server'
import { createPaymentIntent } from '@/app/payments/payment-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bookingId, provider, amountAed, returnUrl, customerEmail, customerName } = body

    if (!bookingId || !provider || !amountAed || !returnUrl || !customerEmail || !customerName) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    const result = await createPaymentIntent({
      bookingId,
      amountAed,
      currency: 'AED',
      provider,
      returnUrl,
      customerEmail,
      customerName,
      metadata: {}
    })

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Payment initiation failed' }, { status: 500 })
  }
}