import {
  Users,
  UserCog,
  Shield,
  Briefcase,
  Headphones,
  Truck,
  DollarSign,
  UserPlus,
  ArrowUpCircle,
} from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import AddStaffForm from './AddStaffForm'
import { promoteToStaff, demoteToCustomer } from './actions'

export default async function AdminStaffPage() {
  const { supabase, user: currentUser } = await requireAdmin()

  const [staffRes, customersRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .neq('role', 'customer')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const staff = staffRes.data ?? []
  const customers = customersRes.data ?? []

  const { data: activity } = await supabase
    .from('activity_logs')
    .select('id, actor_id, action, entity_type, entity_id, created_at')
    .order('created_at', { ascending: false })
    .limit(20)
  const activityMissing = activity == null

  const stats = [
    { label: 'Total Staff', value: staff.length, icon: Users, color: 'text-[var(--accent)] bg-[var(--accent)]/10' },
    { label: 'Super Admins', value: staff.filter((s) => s.role === 'super_admin').length, icon: Shield, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Fleet Managers', value: staff.filter((s) => s.role === 'fleet_manager').length, icon: Briefcase, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Support', value: staff.filter((s) => s.role === 'support').length, icon: Headphones, color: 'text-yellow-500 bg-yellow-500/10' },
    { label: 'Finance', value: staff.filter((s) => s.role === 'finance').length, icon: DollarSign, color: 'text-green-500 bg-green-500/10' },
    { label: 'Delivery', value: staff.filter((s) => s.role === 'delivery').length, icon: Truck, color: 'text-orange-500 bg-orange-500/10' },
  ]

  const roleConfig: Record<string, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-600' },
    fleet_manager: { label: 'Fleet Manager', color: 'bg-blue-500/10 text-blue-600' },
    finance: { label: 'Finance', color: 'bg-green-500/10 text-green-600' },
    support: { label: 'Support', color: 'bg-yellow-500/10 text-yellow-600' },
    delivery: { label: 'Delivery Staff', color: 'bg-orange-500/10 text-orange-600' },
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header with Add Staff Button */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">Team</p>
          <h1 className="mt-2 text-3xl font-bold">Staff Management</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Add, manage, and assign roles to your team members.
          </p>
        </div>
        <AddStaffForm />
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current Staff */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] p-5">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Current Staff</h2>
            <span className="ml-auto text-xs text-[var(--muted-foreground)]">
              {staff.length} member{staff.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            No staff members yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {staff.map((member) => {
              const config = roleConfig[member.role] ?? roleConfig.support
              return (
                <div key={member.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
                      {(member.full_name?.[0] ?? member.email?.[0] ?? 'U').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{member.full_name ?? 'Unnamed'}</p>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {member.email ?? 'No email'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                    {member.id !== currentUser.id && (
                      <form action={demoteToCustomer}>
                        <input type="hidden" name="userId" value={member.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-500/10"
                        >
                          Demote
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Promote Customer */}      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] p-5">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="font-semibold">Promote Customer to Staff</h2>
            <span className="ml-auto text-xs text-[var(--muted-foreground)]">
              {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            No customers available. New signups will appear here.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {customers.map((c) => (
              <div key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-bold text-[var(--muted-foreground)]">
                    {(c.full_name?.[0] ?? c.email?.[0] ?? 'U').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.full_name ?? 'Unnamed'}</p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {c.email ?? 'No email'}
                    </p>
                  </div>
                </div>

                <form action={promoteToStaff} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={c.id} />
                  <select
                    name="role"
                    required
                    defaultValue="support"
                    className="min-h-[36px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <option value="support">Support</option>
                    <option value="fleet_manager">Fleet Manager</option>
                    <option value="finance">Finance</option>
                    <option value="delivery">Delivery</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
                  >
                    <ArrowUpCircle className="h-3 w-3" />
                    Promote
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] p-5">
          <h2 className="font-semibold">Activity Log</h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">Recent admin actions across the panel.</p>
        </div>
        {activityMissing ? (
          <p className="p-5 text-sm text-[var(--muted-foreground)]">
            The <code>activity_logs</code> table is not provisioned yet — admin actions are still processed, just not listed here.
          </p>
        ) : (activity ?? []).length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted-foreground)]">No admin activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {(activity ?? []).map((a: { id: string; action: string; entity_type?: string | null; entity_id?: string | null; created_at?: string | null }) => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{String(a.action).replace(/_/g, ' ')}</p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {a.entity_type ?? ''} {a.entity_id ? `· ${String(a.entity_id).slice(0, 8)}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                  {a.created_at ? new Date(a.created_at).toLocaleDateString('en-AE', { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}