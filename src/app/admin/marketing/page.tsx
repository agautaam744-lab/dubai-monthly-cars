import { requireAdmin } from '@/lib/admin'
import { Megaphone, Users, Gift, TrendingUp } from 'lucide-react'
import BroadcastForm from './BroadcastForm'
import ReferralSettingsForm from './ReferralSettingsForm'
import type { NotificationRow } from '@/types/database'

export default async function AdminMarketingPage() {
  const { supabase } = await requireAdmin()

  const { data: campaigns, error } = await supabase
    .from('notifications')
    .select('id, title, body, type, is_read, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.log('Marketing data fetch note:', error.message)
  }

  const allCampaigns = (campaigns ?? []) as NotificationRow[]

  // Real subscriber count: all registered customers
  const { count: totalSubscribers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'customer')

  // Referral settings
  const { data: referralSettings } = await supabase
    .from('referral_settings')
    .select('id, is_active, reward_amount_aed, referrer_bonus_aed, min_booking_amount_aed, max_referrals_per_user, updated_at')
    .limit(1)
    .maybeSingle()

  // Real notification counts (all-time, not just the last 10 shown below)
  const { count: totalNotifications } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })

  const { count: unreadNotifications } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  const readCount = (totalNotifications ?? 0) - (unreadNotifications ?? 0)
  const engagementRate =
    totalNotifications && totalNotifications > 0
      ? Math.round((readCount / totalNotifications) * 100)
      : 0

  const stats = {
    totalSubscribers: totalSubscribers ?? 0,
    activeCampaigns: unreadNotifications ?? 0,
    avgOpenRate: `${engagementRate}%`,
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Growth & Retention</p>
        <h1 className="mt-2 text-3xl font-bold">Marketing & CRM</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Manage push campaigns, customer segments, and loyalty offers.
        </p>
      </div>

      <BroadcastForm />
            {/* REFERRAL SETTINGS */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <Gift className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="font-serif text-lg tracking-tight">Referral Program Settings</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Configure rewards, limits, and program status
            </p>
          </div>
        </div>
        <ReferralSettingsForm settings={referralSettings ?? null} />
      </div>


      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-semibold">Loyalty & Referral Settings</h2>
        </div>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--muted)]/50 p-4">
            <p className="font-semibold">Referral payout</p>
            <p className="mt-1 text-[var(--muted-foreground)]">AED 200 wallet credit each side after first paid rental.</p>
          </div>
          <div className="rounded-xl bg-[var(--muted)]/50 p-4">
            <p className="font-semibold">Renewal discounts</p>
            <p className="mt-1 text-[var(--muted-foreground)]">3 mo −5% · 6 mo −10% · 12 mo −15%, applied automatically.</p>
          </div>
          <div className="rounded-xl bg-[var(--muted)]/50 p-4">
            <p className="font-semibold">Segments</p>
            <p className="mt-1 text-[var(--muted-foreground)]">{stats.totalSubscribers.toLocaleString()} customers · engagement {stats.avgOpenRate}.</p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Users className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Total Subscribers</p>
              <p className="text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Megaphone className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Active Campaigns</p>
              <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Avg. Engagement Rate</p>
              <p className="text-2xl font-bold">{stats.avgOpenRate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-bold">Recent Campaigns & Notifications</h2>
          </div>
        </div>
        
        {allCampaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
            <h2 className="mt-4 font-semibold">No campaigns yet</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Create your first push notification or loyalty offer to see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {allCampaigns.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 transition hover:bg-[var(--muted)]/50">
                <div>
                  <p className="font-semibold">{item.title || 'General Notification'}</p>
                  <p className="text-sm text-[var(--muted-foreground)] line-clamp-1">{item.body || 'No details provided'}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Type: {item.type || 'general'} · Sent: {item.created_at ? new Date(item.created_at).toLocaleDateString('en-AE') : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.is_read ? 'bg-gray-500/10 text-gray-600' : 'bg-green-500/10 text-green-600'
                  }`}>
                    {item.is_read ? 'Completed' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
