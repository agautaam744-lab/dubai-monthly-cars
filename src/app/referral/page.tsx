import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Gift, Users, Copy } from 'lucide-react'

export const metadata = { title: 'Referral Program | Dubai Monthly Cars' }

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/referral')

  const referralCode = user.id.slice(0, 8).toUpperCase()

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 min-h-screen bg-[var(--background)]">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Referral Program</p>
      <h1 className="mt-2 text-3xl font-bold">Invite friends, earn credit</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">Share your code. Both you and your friend get AED 200 wallet credit after their first paid rental.</p>

      <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
            <Gift className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">Your referral code</p>
            <p className="font-mono text-2xl font-bold tracking-widest">{referralCode}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--muted)] p-3 text-sm">
          <Users className="h-4 w-4 shrink-0" />
          <span className="truncate">https://duba imonthlycars.ae/signup?ref={referralCode}</span>
        </div>
        <p className="mt-3 flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><Copy className="h-3 w-3" /> Copy the code above and share via WhatsApp.</p>
      </div>
    </main>
  )
}
