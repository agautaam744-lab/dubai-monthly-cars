'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save,
  Loader2,
  AlertCircle,
  Check,
  Gift,
  Power,
  Sparkles,
} from 'lucide-react'
import { updateReferralSettings } from './referralSettingsActions'

type Settings = {
  id: string
  is_active: boolean
  reward_amount_aed: number
  referrer_bonus_aed: number
  min_booking_amount_aed: number
  max_referrals_per_user: number | null
  updated_at: string | null
}

export default function ReferralSettingsForm({
  settings,
}: {
  settings: Settings | null
}) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(settings?.is_active ?? true)
  const [rewardAmount, setRewardAmount] = useState(
    String(settings?.reward_amount_aed ?? 200)
  )
  const [referrerBonus, setReferrerBonus] = useState(
    String(settings?.referrer_bonus_aed ?? 200)
  )
  const [minBookingAmount, setMinBookingAmount] = useState(
    String(settings?.min_booking_amount_aed ?? 1000)
  )
  const [maxReferrals, setMaxReferrals] = useState(
    settings?.max_referrals_per_user ? String(settings.max_referrals_per_user) : ''
  )
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    setError('')

    const result = await updateReferralSettings({
      isActive,
      rewardAmount: Number(rewardAmount),
      referrerBonus: Number(referrerBonus),
      minBookingAmount: Number(minBookingAmount),
      maxReferrals: maxReferrals ? Number(maxReferrals) : null,
    })

    if (!result.ok) {
      setError(result.error ?? 'Failed to save')
      setLoading(false)
      return
    }

    setMsg('Referral settings saved successfully')
    setLoading(false)
    router.refresh()
    setTimeout(() => setMsg(''), 3000)
  }

  const inputClass =
    'min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-semibold tabular-nums outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]'

  const labelClass =
    'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]'

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Toggle */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isActive ? 'bg-emerald-500/10' : 'bg-gray-500/10'
              }`}
            >
              <Power
                className={`h-5 w-5 ${
                  isActive ? 'text-emerald-600' : 'text-gray-500'
                }`}
              />
            </div>
            <div>
              <p className="font-serif text-lg tracking-tight">Program Status</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {isActive
                  ? 'Active — customers can earn referral bonuses'
                  : 'Paused — new referrals will not be credited'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={[
              'relative h-7 w-12 shrink-0 rounded-full transition-colors',
              isActive ? 'bg-emerald-500' : 'bg-gray-300',
            ].join(' ')}
            aria-pressed={isActive}
          >
            <span
              className={[
                'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform',
                isActive ? 'translate-x-[22px]' : 'translate-x-0.5',
              ].join(' ')}
            />
          </button>
        </div>
      </div>

      {/* Reward amounts */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Gift className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <p className="font-serif text-lg tracking-tight">Reward Amounts</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Credit added to wallets after first paid booking
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Referrer Bonus (AED)</label>
            <input
              type="number"
              min={0}
              value={referrerBonus}
              onChange={(e) => setReferrerBonus(e.target.value)}
              className={inputClass}
              required
            />
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              Goes to the customer who invited
            </p>
          </div>

          <div>
            <label className={labelClass}>Friend Reward (AED)</label>
            <input
              type="number"
              min={0}
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              className={inputClass}
              required
            />
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              Goes to the new customer
            </p>
          </div>

          <div>
            <label className={labelClass}>Min Booking (AED)</label>
            <input
              type="number"
              min={0}
              value={minBookingAmount}
              onChange={(e) => setMinBookingAmount(e.target.value)}
              className={inputClass}
              required
            />
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              Minimum first booking to qualify
            </p>
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <p className="font-serif text-lg tracking-tight">Limits</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Optional caps to prevent abuse
            </p>
          </div>
        </div>

        <div>
          <label className={labelClass}>Max Referrals Per User</label>
          <input
            type="number"
            min={0}
            value={maxReferrals}
            onChange={(e) => setMaxReferrals(e.target.value)}
            placeholder="Leave empty for unlimited"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            Total rewarded referrals allowed per customer
          </p>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {msg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600">
          <Check className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{msg}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Settings
          </>
        )}
      </button>
    </form>
  )
}