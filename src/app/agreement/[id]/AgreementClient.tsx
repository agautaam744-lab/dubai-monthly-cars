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

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (e: any) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: any) => {
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

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
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

  if (booking.agreement_signed_at) {
    return (
      <div className="rounded-3xl border border-green-500/30 bg-green-500/5 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/15">
          <Check className="h-7 w-7 text-green-500" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Agreement Signed</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
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
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
        >
          Back to Bookings
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-semibold">Rental Agreement Terms</h2>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <div className="rounded-2xl bg-[var(--muted)]/50 p-4">
            <p className="mb-2 font-semibold">1. Renter Information</p>
            <div className="grid gap-1 text-xs">
              <p>Name: {profile.full_name ?? '—'}</p>
              <p>Email: {profile.email ?? '—'}</p>
              <p>Phone: {profile.phone ?? '—'}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--muted)]/50 p-4">
            <p className="mb-2 font-semibold">2. Vehicle Details</p>
            <div className="grid gap-1 text-xs">
              <p>Vehicle: {vehicle.make} {vehicle.model} ({vehicle.year ?? '—'})</p>
              <p>Plate: {vehicle.plate_number ?? '—'}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--muted)]/50 p-4">
            <p className="mb-2 font-semibold">3. Rental Period & Payment</p>
            <div className="grid gap-1 text-xs">
              <p>Start: {new Date(booking.start_date).toLocaleDateString('en-AE')}</p>
              <p>Duration: {booking.duration_months} month{booking.duration_months > 1 ? 's' : ''}</p>
              <p>Monthly Rent: {formatAED(Number(booking.monthly_price_aed))}</p>
              <p>Deposit: {formatAED(Number(booking.deposit_aed))}</p>
              <p>Delivery: {booking.delivery_type === 'home_delivery' ? 'Home Delivery' : 'Pickup'}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <p className="font-semibold">4. Terms and Conditions</p>
            <ul className="ml-4 list-disc space-y-1.5 text-[var(--muted-foreground)]">
              <li>The renter agrees to use the vehicle only for lawful purposes within the UAE.</li>
              <li>The renter is responsible for traffic fines, tolls, and violations during the rental.</li>
              <li>The vehicle must be returned in the same condition, subject to normal wear and tear.</li>
              <li>Monthly rent must be paid on time. Late payments may incur penalties.</li>
              <li>Security deposit is refundable after inspection, minus damages or fines.</li>
              <li>The renter must not sublet or transfer the vehicle to any third party.</li>
              <li>Any damage must be reported immediately via the app with photos.</li>
              <li>The renter must possess a valid UAE or International driving license.</li>
              <li>The company reserves the right to terminate for violation of terms.</li>
              <li>This agreement is governed by the laws of the United Arab Emirates.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Your Signature</h2>
          </div>
          {hasSignature && (
            <button
              type="button"
              onClick={clearSignature}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] transition hover:text-red-500"
            >
              <Eraser className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border)] bg-white">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="block h-40 w-full touch-none cursor-crosshair"
          />
          {!hasSignature && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-gray-400">Sign here using mouse or finger</p>
            </div>
          )}
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 cursor-pointer rounded accent-[var(--accent)]"
          />
          <span className="text-sm">
            I have read and agree to the terms and conditions of this rental agreement.
          </span>
        </label>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !hasSignature || !agreed}
          className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Sign Agreement
            </>
          )}
        </button>
      </div>
    </div>
  )
}