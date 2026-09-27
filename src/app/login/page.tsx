'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'email' | 'phone'
type EmailMode = 'signin' | 'signup'
type PhoneStep = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [authMode, setAuthMode] =
    useState<AuthMode>('email')

  const [emailMode, setEmailMode] =
    useState<EmailMode>('signin')

  const [phoneStep, setPhoneStep] =
    useState<PhoneStep>('phone')
    

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')
  const [otp, setOtp] = useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] =
    useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const clearMessages = () => {
    setMessage('')
    setError('')
  }

  const handleEmailAuth = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    clearMessages()

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    if (
      emailMode === 'signup' &&
      password !== confirmPassword
    ) {
      setError('Passwords do not match.')
      return
    }

    if (
      emailMode === 'signup' &&
      password.length < 6
    ) {
      setError(
        'Password must be at least 6 characters.'
      )
      return
    }

    setLoading(true)

    try {
      if (emailMode === 'signup') {
        const { data, error } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
            },
          })

        if (error) {
          throw error
        }

        if (!data.session) {
          setMessage(
            'Account created. Please check your email to confirm your account.'
          )
          setPassword('')
          setConfirmPassword('')
          return
        }

        router.push('/dashboard')
        return
      }

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

      if (error) {
        throw error
      }

      router.push('/dashboard')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Authentication failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  const sendPhoneOtp = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    clearMessages()

    if (!phone.trim()) {
      setError(
        'Enter your phone number with country code, for example +971501234567.'
      )
      return
    }

    setLoading(true)

    try {
      const { error } =
        await supabase.auth.signInWithOtp({
          phone: phone.trim(),
        })

      if (error) {
        throw error
      }

      setPhoneStep('otp')
      setMessage(
        'A verification code has been sent to your phone.'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not send OTP.'
      )
    } finally {
      setLoading(false)
    }
  }

  const verifyPhoneOtp = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    clearMessages()

    if (!otp.trim()) {
      setError('Enter the OTP sent to your phone.')
      return
    }

    setLoading(true)

    try {
      const { error } =
        await supabase.auth.verifyOtp({
          phone: phone.trim(),
          token: otp.trim(),
          type: 'sms',
        })

      if (error) {
        throw error
      }

      router.push('/dashboard')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'OTP verification failed.'
      )
    } finally {
      setLoading(false)
    }
  }

const signInWithGoogle = async () => {
  clearMessages()
  setGoogleLoading(true)

  try {
    const redirectTo =
      `${window.location.origin}/auth/callback?next=/dashboard`

    const { data, error } =
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

    if (error) {
      throw error
    }

    // Explicit redirect fallback.
    // Normally Supabase redirects automatically.
    if (data?.url) {
      window.location.assign(data.url)
    } else {
      setGoogleLoading(false)
      setError(
        'Google sign-in could not start. Please check your Google/Supabase configuration.'
      )
    }
  } catch (err) {
    setGoogleLoading(false)

    setError(
      err instanceof Error
        ? err.message
        : 'Google sign-in failed.'
    )
  }
}

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* =====================================================
            BRAND PANEL
        ====================================================== */}

        <section className="hidden bg-[var(--primary)] text-[var(--primary-foreground)] lg:flex lg:flex-col lg:justify-between lg:p-12">
          <Link
            href="/"
            className="flex items-center gap-3 text-lg font-bold"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
              🚗
            </span>

            Dubai Monthly Cars
          </Link>

          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Monthly car rental in Dubai
            </p>

            <h1 className="mt-5 text-5xl font-bold tracking-tight">
              Your car.
              <br />
              Your month.
              <br />
              Your flexibility.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--primary-foreground)]/70">
              Sign in to manage your vehicles, documents,
              bookings, payments and monthly rental plans.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'Flexible 1, 3, 6 and 12 month plans',
                'Secure document and KYC workflow',
                'Manage your monthly rental in one place',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]/20">
                    <Check className="h-4 w-4 text-[var(--accent)]" />
                  </span>

                  <span className="text-sm text-[var(--primary-foreground)]/80">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-[var(--primary-foreground)]/40">
            Dubai Monthly Cars
          </p>
        </section>

        {/* =====================================================
            AUTH PANEL
        ====================================================== */}

        <section className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md">
            {/* Mobile brand */}

            <Link
              href="/"
              className="mb-8 flex items-center gap-2 font-bold lg:hidden"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)]">
                🚗
              </span>

              Dubai Monthly Cars
            </Link>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Sign in to continue
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Access your monthly rental account.
                </p>
              </div>

              {/* =================================================
                  AUTH METHOD TABS
              ================================================== */}

              <div className="mt-7 grid grid-cols-2 rounded-xl bg-[var(--muted)] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('email')
                    clearMessages()
                  }}
                  className={[
                    'min-h-[44px] rounded-lg text-sm font-semibold transition',
                    authMode === 'email'
                      ? 'bg-[var(--card)] shadow-sm'
                      : 'text-[var(--muted-foreground)]',
                  ].join(' ')}
                >
                  Email
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('phone')
                    clearMessages()
                  }}
                  className={[
                    'min-h-[44px] rounded-lg text-sm font-semibold transition',
                    authMode === 'phone'
                      ? 'bg-[var(--card)] shadow-sm'
                      : 'text-[var(--muted-foreground)]',
                  ].join(' ')}
                >
                  Phone OTP
                </button>
              </div>

              {/* =================================================
                  GOOGLE
              ================================================== */}

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={googleLoading}
                className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-base font-bold">
                  G
                </span>

                {googleLoading
                  ? 'Connecting...'
                  : 'Continue with Google'}
              </button>

              {/* Divider */}

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-xs text-[var(--muted-foreground)]">
                  OR
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              {/* =================================================
                  EMAIL AUTH
              ================================================== */}

              {authMode === 'email' && (
                <>
                  <div className="mb-4 flex rounded-xl border border-[var(--border)] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailMode('signin')
                        clearMessages()
                      }}
                      className={[
                        'min-h-[42px] flex-1 rounded-lg text-sm font-semibold',
                        emailMode === 'signin'
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : '',
                      ].join(' ')}
                    >
                      Sign in
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmailMode('signup')
                        clearMessages()
                      }}
                      className={[
                        'min-h-[42px] flex-1 rounded-lg text-sm font-semibold',
                        emailMode === 'signup'
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : '',
                      ].join(' ')}
                    >
                      Create account
                    </button>
                  </div>

                  <form
                    onSubmit={handleEmailAuth}
                    className="space-y-4"
                  >
                    {emailMode === 'signup' && (
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium">
                          Full name
                        </span>

                        <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4">
                          <User className="h-5 w-5 text-[var(--muted-foreground)]" />

                          <input
                            type="text"
                            value={fullName}
                            onChange={(event) =>
                              setFullName(event.target.value)
                            }
                            placeholder="Your full name"
                            className="w-full bg-transparent text-sm outline-none"
                            required
                          />
                        </div>
                      </label>
                    )}

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium">
                        Email
                      </span>

                      <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4">
                        <Mail className="h-5 w-5 text-[var(--muted-foreground)]" />

                        <input
                          type="email"
                          value={email}
                          onChange={(event) =>
                            setEmail(event.target.value)
                          }
                          placeholder="you@example.com"
                          className="w-full bg-transparent text-sm outline-none"
                          required
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium">
                        Password
                      </span>

                      <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4">
                        <ShieldCheck className="h-5 w-5 text-[var(--muted-foreground)]" />

                        <input
                          type={
                            showPassword
                              ? 'text'
                              : 'password'
                          }
                          value={password}
                          onChange={(event) =>
                            setPassword(event.target.value)
                          }
                          placeholder="••••••••"
                          className="w-full bg-transparent text-sm outline-none"
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (current) => !current
                            )
                          }
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </label>

                    {emailMode === 'signup' && (
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium">
                          Confirm password
                        </span>

                        <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4">
                          <ShieldCheck className="h-5 w-5 text-[var(--muted-foreground)]" />

                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                              setConfirmPassword(
                                event.target.value
                              )
                            }
                            placeholder="••••••••"
                            className="w-full bg-transparent text-sm outline-none"
                            required
                          />
                        </div>
                      </label>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading
                        ? 'Please wait...'
                        : emailMode === 'signin'
                          ? 'Sign in'
                          : 'Create account'}

                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </>
              )}

              {/* =================================================
                  PHONE OTP
              ================================================== */}

              {authMode === 'phone' && (
                <>
                  {phoneStep === 'phone' ? (
                    <form
                      onSubmit={sendPhoneOtp}
                      className="space-y-4"
                    >
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium">
                          UAE / international phone number
                        </span>

                        <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4">
                          <Phone className="h-5 w-5 text-[var(--muted-foreground)]" />

<input
  type="tel"
  value={phone}
  onChange={(event) =>
    setPhone(
      event.target.value.replace(/[^\d+]/g, '')
    )
  }
  placeholder="+971501234567"
  className="w-full bg-transparent text-sm outline-none"
  required
/>
                        </div>
                      </label>

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <MessageSquare className="h-4 w-4" />

                        {loading
                          ? 'Sending OTP...'
                          : 'Send OTP'}
                      </button>
                    </form>
                  ) : (
                    <form
                      onSubmit={verifyPhoneOtp}
                      className="space-y-4"
                    >
                      <div className="rounded-2xl bg-[var(--muted)] p-4 text-sm">
                        <p className="font-semibold">
                          Verify your phone
                        </p>

                        <p className="mt-1 text-[var(--muted-foreground)]">
                          We sent a 6-digit code to:
                        </p>

                        <p className="mt-1 font-semibold">
                          {phone}
                        </p>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium">
                          OTP
                        </span>

                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={otp}
                          onChange={(event) =>
                            setOtp(
                              event.target.value.replace(
                                /\D/g,
                                ''
                              )
                            )
                          }
                          placeholder="123456"
                          className="min-h-[54px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 text-center text-lg font-bold tracking-[0.4em] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                          required
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading
                          ? 'Verifying...'
                          : 'Verify OTP'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPhoneStep('phone')
                          setOtp('')
                          clearMessages()
                        }}
                        className="min-h-[44px] w-full rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)]"
                      >
                        Use another number
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* =================================================
                  FEEDBACK
              ================================================== */}

              {error && (
                <div className="mt-5 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
                  {error}
                </div>
              )}

              {message && (
                <div className="mt-5 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 p-4 text-sm text-[var(--success)]">
                  {message}
                </div>
              )}

              <p className="mt-6 text-center text-xs leading-5 text-[var(--muted-foreground)]">
                By continuing, you agree to the account and
                rental service terms.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}