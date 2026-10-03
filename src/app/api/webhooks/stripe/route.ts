import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { processStripeEvent } from '@/lib/payments/stripe-webhook'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')

  if (!secretKey || !webhookSecret || !signature) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  // Signature verification needs the raw body, so read text, not json.
  const body = await request.text()
  const stripe = new Stripe(secretKey)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    await processStripeEvent(event)
  } catch (err) {
    console.error('[stripe-webhook] processing failed:', err)
    // 500 makes Stripe retry later; handler is idempotent so retries are safe.
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}