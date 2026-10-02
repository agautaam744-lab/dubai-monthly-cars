'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  Loader2,
  Eraser,
  FileText,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Car,
  Calendar,
  CreditCard,
  User,
  Pen,
  ArrowRight,
} from 'lucide-react'
import { signAgreement } from '../actions'

type Booking = {
  id: string
  start_date: string
  duration_months: number
  monthly_price_aed: number | string
  deposit_aed: number | string
  delivery_type: string | null
  delivery_address: string | null
  agreement_signed_at: string | null
}

type Vehicle = {
  make: string
  model: string
  year: number | null
  plate_number: string | null
}

type Profile = {
  full_name: string | null
  email: string | null
  phone: string | null
}

function formatAED(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(value)
}

const TERMS = [
  'The renter agrees to use the vehicle only for lawful purposes within the UAE.',
  'The renter is responsible for traffic fines, tolls, and violations during the rental.',
  'The vehicle must be returned in the same condition, subject to normal wear and tear.',
  'Monthly rent must be paid on time. Late payments may incur penalties.',
  'Security deposit is refundable after inspection, minus damages or fines.',
  'The renter must not sublet or transfer the vehicle to any third party.',
  'Any damage must be reported immediately via the app with photos.',
  'The renter must possess a valid UAE or International driving license.',
  'The company reserves the right to terminate for violation of terms.',
  'This agreement is governed by the laws of the United Arab Emirates.',
]

export default function AgreementClient({
  booking,
  vehicle,
  profile,
}: {
  booking: Booking
  vehicle: Vehicle
  profile: Profile
}) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const setup = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    setup()
    window.addEventListener('resize', setup)
    return () => window.removeEventListener('resize', setup)
  }, [])

  type PointerEvent = React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>

  const getCoordinates = (e: PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const startDrawing = (e: PointerEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: PointerEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    setHasSignature(false)
  }

  const handleSubmit = async () => {
    if (!hasSignature) {
      setError('Please provide your signature')
      return
    }
    if (!agreed) {
      setError('Please accept the terms and conditions')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const signatureDataUrl = canvas.toDataURL('image/png')

    setSubmitting(true)
    setError('')

    const result = await signAgreement({
      bookingId: booking.id,
      signatureDataUrl,
    })

    if (!result.ok) {
      setError(result.error ?? 'Failed to sign agreement')
      setSubmitting(false)
      return
    }

    router.refresh()
  }

  // ALREADY SIGNED STATE
  if (booking.agreement_signed_at) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent p-8 text-center sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl"
        />
        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Check className="h-8 w-8 text-emerald-600" aria-hidden="true" />
          </div>
          <h2 className="mt-6 font-serif text-3xl tracking-tight">
            Agreement Signed
          </h2>
          <p className="mt-3 text-sm text-[var(--foreground)]/70">
            Signed on{' '}
            {new Date(booking.agreement_signed_at).toLocaleDateString('en-AE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <button
            type="button"
            onClick={() => router.push('/bookings')}
            className="group mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[var(--accent)] px-7 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Back to Bookings
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* BOOKING SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Car className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
            Vehicle
          </p>
          <p className="mt-1 font-serif text-lg tracking-tight">
            {vehicle.make} {vehicle.model}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {vehicle.year ?? '—'} · {vehicle.plate_number ?? 'No plate'}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Calendar className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
            Rental Period
          </p>
          <p className="mt-1 font-serif text-lg tracking-tight">
            {new Date(booking.start_date).toLocaleDateString('en-AE', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {booking.duration_months} month{booking.duration_months > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <CreditCard className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
            Payment
          </p>
          <p className="mt-1 font-serif text-lg tracking-tight tabular-nums text-[var(--accent)]">
            {formatAED(Number(booking.monthly_price_aed))}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Deposit {formatAED(Number(booking.deposit_aed))}
          </p>
        </div>
      </div>

      {/* AGREEMENT TERMS */}
      <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="flex items-center gap-3 border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <FileText className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-serif text-xl tracking-tight">Rental Agreement Terms</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Please read carefully before signing
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {/* Renter Info */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30">
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                1
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--foreground)]/80">
                Renter Information
              </p>
            </div>
            <div className="grid gap-2 p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Name</p>
                <p className="mt-0.5 font-medium">{profile.full_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Email</p>
                <p className="mt-0.5 truncate font-medium">{profile.email ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Phone</p>
                <p className="mt-0.5 font-medium">{profile.phone ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30">
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                2
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--foreground)]/80">
                Vehicle Details
              </p>
            </div>
            <div className="grid gap-2 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Vehicle</p>
                <p className="mt-0.5 font-medium">
                  {vehicle.make} {vehicle.model} ({vehicle.year ?? '—'})
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Plate Number</p>
                <p className="mt-0.5 font-mono font-medium">{vehicle.plate_number ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Rental Terms */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30">
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                3
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--foreground)]/80">
                Rental Period & Payment
              </p>
            </div>
            <div className="grid gap-2 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Start Date</p>
                <p className="mt-0.5 font-medium">
                  {new Date(booking.start_date).toLocaleDateString('en-AE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Duration</p>
                <p className="mt-0.5 font-medium">
                  {booking.duration_months} month{booking.duration_months > 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Monthly Rent</p>
                <p className="mt-0.5 font-semibold tabular-nums text-[var(--accent)]">
                  {formatAED(Number(booking.monthly_price_aed))}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Delivery</p>
                <p className="mt-0.5 font-medium">
                  {booking.delivery_type === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
                </p>
              </div>
            </div>
          </div>

          {/* Terms list */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30">
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                4
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--foreground)]/80">
                Terms & Conditions
              </p>
            </div>
            <ul className="space-y-3 p-4 text-sm">
              {TERMS.map((term, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[9px] font-bold text-[var(--accent)]">
                    {idx + 1}
                  </span>
                  <span className="leading-6 text-[var(--foreground)]/80">{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SIGNATURE */}
      <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <ShieldCheck className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-xl tracking-tight">Your Signature</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Sign below using mouse or finger
              </p>
            </div>
          </div>
          {hasSignature && (
            <button
              type="button"
              onClick={clearSignature}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-[var(--muted-foreground)] transition hover:border-red-500/40 hover:text-red-500"
            >
              <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border)] bg-white transition focus-within:border-[var(--accent)]">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="block h-44 w-full touch-none cursor-crosshair"
            />
            {!hasSignature && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Pen className="mx-auto h-6 w-6 text-gray-300" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-gray-400">
                    Sign here
                  </p>
                </div>
              </div>
            )}
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/30 p-4 transition hover:border-[var(--accent)]/40">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 cursor-pointer rounded accent-[var(--accent)]"
            />
            <span className="text-sm leading-6">
              I have read and agree to the terms and conditions of this rental agreement.
            </span>
          </label>

          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !hasSignature || !agreed}
            className="group mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Signing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Sign Agreement
              </>
            )}
          </button>

          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-[var(--muted-foreground)]">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <p>
              Your signature is stored securely and legally binds you to this rental agreement in accordance with UAE law.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}