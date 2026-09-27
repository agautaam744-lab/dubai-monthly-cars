'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Check } from 'lucide-react'
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Email</label>
        <input
          type="email"
          value={profile.email ?? ''}
          disabled
          className="min-h-[44px] w-full cursor-not-allowed rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 text-sm text-[var(--muted-foreground)] outline-none"
        />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Email cannot be changed. Contact support for assistance.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+971 50 123 4567"
          className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Preferred Language
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['en', 'ar'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={[
                'min-h-[48px] rounded-xl border px-4 text-sm font-semibold transition',
                language === lang
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] ring-1 ring-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/50',
              ].join(' ')}
            >
              {lang === 'en' ? '🇬🇧 English' : '🇦🇪 العربية'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-green-500/10 p-3 text-sm text-green-500">
          <Check className="h-4 w-4" />
          Profile updated successfully
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Changes
          </>
        )}
      </button>
    </form>
  )
}