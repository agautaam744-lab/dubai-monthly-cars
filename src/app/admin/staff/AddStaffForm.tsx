'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  Loader2,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'


type CreateStaffMemberAction = (
  formData: FormData
) => Promise<{
  ok: boolean
  message?: string
  error?: string
}>

type AddStaffFormProps = {
  createStaffMember: CreateStaffMemberAction
}

export default function AddStaffForm({
  createStaffMember,
}: AddStaffFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('support')

  const reset = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setRole('support')
    setError('')
    setSuccess('')
    setShowPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('email', email)
    formData.append('password', password)
    formData.append('role', role)

    const result = await createStaffMember(formData)

    if (!result.ok) {
      setError(result.error ?? 'Failed to create staff')
      setLoading(false)
      return
    }

    setSuccess(result.message ?? 'Staff added successfully!')
    setLoading(false)

    setTimeout(() => {
      reset()
      setOpen(false)
      router.refresh()
    }, 1800)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
      >
        <UserPlus className="h-4 w-4" />
        Add New Staff
      </button>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--accent)]/40 bg-[var(--accent)]/5 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="font-semibold">Add New Staff Member</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            reset()
            setOpen(false)
          }}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ahmed Khan"
              required
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@company.com"
              required
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                minLength={8}
                className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-4 pr-11 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Staff member ye password use karega login ke liye
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="support">Support Agent</option>
              <option value="fleet_manager">Fleet Manager</option>
              <option value="finance">Finance</option>
              <option value="delivery">Delivery Staff</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-xl bg-green-500/10 p-3 text-sm text-green-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              reset()
              setOpen(false)
            }}
            disabled={loading}
            className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 text-sm font-semibold transition hover:bg-[var(--muted)] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Create Staff Member
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
