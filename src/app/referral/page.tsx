import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Gift,
  Users,
  Sparkles,
  Share2,
  Wallet,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Mail,
  MessageCircle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import CopyButton from './CopyButton'

export const metadata = { title: 'Referral Program | Dubai Monthly Cars' }

const REWARD_AED = 200

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/referral')

  const referralCode = user.id.slice(0, 8).toUpperCase()
  const referralLink = `https://dubai-monthly-cars.vercel.app/signup?ref=${referralCode}`

  // Fetch referral history
  const { data: referrals } = await supabase
    .from('referrals')
    .select('id, referred_id, status, reward_aed, created_at')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const allReferrals = referrals ?? []
  const completed = allReferrals.filter((r) => r.status === 'completed' || r.status === 'rewarded')
  const pending = allReferrals.filter((r) => r.status === 'pending')
  const totalEarnings = completed.reduce(
    (sum, r) => sum + Number(r.reward_aed ?? REWARD_AED),
    0
  )

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: {
      label: 'Pending',
      className: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    },
    completed: {
      label: 'Completed',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    },
    rewarded: {
      label: 'Rewarded',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    },
  }

  const whatsappText = encodeURIComponent(
    `Try Dubai Monthly Cars! Use my referral code ${referralCode} to get AED ${REWARD_AED} credit on your first monthly rental. ${referralLink}`
  )
  const emailSubject = encodeURIComponent('Dubai Monthly Cars — AED 200 off your first month')
  const emailBody = encodeURIComponent(
    `Hey!\n\nI've been renting a car monthly through Dubai Monthly Cars and love it. Use my referral code ${referralCode} and we both get AED ${REWARD_AED} wallet credit after your first rental.\n\nSign up here: ${referralLink}\n\nEnjoy!`
  )

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.18),transparent)]"
        />

        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Referral Program
          </p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            Invite friends,
            <span className="block text-[var(--accent)]">earn AED {REWARD_AED}.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            Share your code. Both you and your friend get AED {REWARD_AED} wallet credit after their first paid rental.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {/* STATS */}
        {allReferrals.length > 0 && (
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                <Users className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                Total Referrals
              </div>
              <p className="mt-2 font-serif text-3xl tabular-nums tracking-tight">
                {allReferrals.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                Completed
              </div>
              <p className="mt-2 font-serif text-3xl tabular-nums tracking-tight text-emerald-600">
                {completed.length}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-transparent p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                Total Earned
              </div>
              <p className="mt-2 font-serif text-3xl tabular-nums tracking-tight text-[var(--accent)]">
                {totalEarnings.toLocaleString()}
                <span className="ms-1 text-sm font-medium">AED</span>
              </p>
            </div>
          </div>
        )}

        {/* REFERRAL CODE CARD */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-transparent p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-24 -top-24 h-56 w-56 rounded-full bg-[var(--accent)]/15 blur-3xl"
          />

          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
              <Gift className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
                Your referral code
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-[var(--accent)]">
                {referralCode}
              </p>
            </div>
          </div>

          {/* Referral link */}
          <div className="relative mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
              Share link
            </p>
            <div className="flex items-center gap-2">
              <div className="flex min-h-[48px] flex-1 items-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] px-4">
                <span className="truncate text-xs font-mono text-[var(--foreground)]/80">
                  {referralLink}
                </span>
              </div>
              <CopyButton text={referralLink} variant="icon" />
            </div>
          </div>

          {/* Share buttons */}
          <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 text-sm font-semibold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-500/10 hover:shadow-md"
            >
              <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
              WhatsApp
            </a>

            <a
              href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
              className="group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 text-sm font-semibold text-sky-700 transition-all hover:-translate-y-0.5 hover:bg-sky-500/10 hover:shadow-md"
            >
              <Mail className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
              Email
            </a>

            <CopyButton text={referralCode} label="Copy Code" />
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Share2 className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl tracking-tight">How it works</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Three steps to earn your credit
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Share your code',
                desc: 'Send your referral code via WhatsApp, email, or copy the link.',
              },
              {
                step: '02',
                title: 'Friend books',
                desc: 'They sign up with your code and complete their first paid rental.',
              },
              {
                step: '03',
                title: 'Both earn',
                desc: `You each get AED ${REWARD_AED} wallet credit — redeemable on your next rental.`,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--accent)]/40 hover:shadow-lg"
              >
                <span className="font-serif text-3xl font-bold text-[var(--accent)]/25">
                  {item.step}
                </span>
                <h3 className="mt-3 font-serif text-lg tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* REFERRAL HISTORY */}
        <div className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <TrendingUp className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl tracking-tight">
                Your referrals
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {allReferrals.length} total · {pending.length} pending
              </p>
            </div>
          </div>

          {allReferrals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 ring-1 ring-inset ring-[var(--accent)]/20">
                <Users className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-serif text-2xl tracking-tight">
                No referrals yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
                Share your code above to start earning. Both you and your friend will receive AED {REWARD_AED} wallet credit after their first paid rental.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allReferrals.map((r) => {
                const config = statusConfig[r.status] ?? statusConfig.pending
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                        <Users className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Referred user #{r.referred_id?.slice(0, 6).toUpperCase() ?? '—'}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {new Date(r.created_at).toLocaleDateString('en-AE', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-[var(--accent)]">
                        +{Number(r.reward_aed ?? REWARD_AED).toLocaleString()} AED
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}
                      >
                        {r.status === 'pending' ? (
                          <Clock className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        )}
                        {config.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--muted)]/30 p-6 text-center sm:flex-row sm:justify-between sm:text-start">
          <div>
            <p className="font-serif text-lg tracking-tight">Track your credit</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              See your wallet balance on your profile page
            </p>
          </div>
          <Link
            href="/profile"
            className="group inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          >
            View Wallet
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>
    </main>
  )
}