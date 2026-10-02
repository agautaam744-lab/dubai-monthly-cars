'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Check, AlertCircle } from 'lucide-react'
import { updateProfile } from './actions'

type Profile = {
  full_name: string | null
  phone: string | null
  email: string | null
  preferred_language: string | null
}

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [language, setLanguage] = useState<'en' | 'ar'>(
    (profile.preferred_language as 'en' | 'ar') ?? 'en'
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')

    const result = await updateProfile({
      fullName,
      phone,
      preferredLanguage: language,
    })

    if (!result.ok) {
      setError(result.error ?? 'Failed to update profile')
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    router.refresh()

    setTimeout(() => setSaved(false), 3000)
  }

  const inputClass =
    'min-h-[52px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]'

  const labelClass =
    'mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          value={profile.email ?? ''}
          disabled
          className="min-h-[52px] w-full cursor-not-allowed rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 px-4 text-sm text-[var(--muted-foreground)] outline-none"
        />
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          Email cannot be changed. Contact support for assistance.
        </p>
      </div>

      <div>
        <label className={labelClass}>Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+971 50 123 4567"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Preferred Language</label>
        <div className="grid grid-cols-2 gap-3">
          {(['en', 'ar'] as const).map((lang) => {
            const active = language === lang
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={[
                  'group relative min-h-[56px] rounded-xl border px-4 text-sm font-semibold transition-all hover:-translate-y-0.5',
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] shadow-md shadow-[var(--accent)]/10'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
                ].join(' ')}
              >
                {active && (
                  <span className="absolute end-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
                <span className="block text-base font-bold">
                  {lang === 'en' ? 'English' : 'العربية'}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                  {lang === 'en' ? 'EN' : 'AR'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600">
          <Check className="h-4 w-4" aria-hidden="true" />
          <p className="font-semibold">Profile updated successfully</p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl hover:shadow-[var(--accent)]/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Changes
          </>
        )}
      </button>
    </form>
  )
}