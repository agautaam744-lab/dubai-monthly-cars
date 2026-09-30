import { requireAdmin } from '@/lib/admin'
import { Megaphone, Users, Gift, TrendingUp } from 'lucide-react'

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

  const allCampaigns = campaigns ?? []

  const stats = {
    totalSubscribers: 1240,
    activeCampaigns: 3,
    avgOpenRate: '68%',
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
          <button className="flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline">
            Create New Campaign →
          </button>
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
            {allCampaigns.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 transition hover:bg-[var(--muted)]/50">
                <div>
                  <p className="font-semibold">{item.title || 'General Notification'}</p>
                  <p className="text-sm text-[var(--muted-foreground)] line-clamp-1">{item.body || 'No details provided'}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Type: {item.type || 'general'} · Sent: {new Date(item.created_at).toLocaleDateString('en-AE')}
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