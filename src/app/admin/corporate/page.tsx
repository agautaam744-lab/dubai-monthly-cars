import { requireAdmin } from '@/lib/admin'
import { Briefcase, Building2, Users, DollarSign } from 'lucide-react'
import CorporateForm from './CorporateForm'
import CorporateActions from './CorporateActions'
import type { CorporateAccountRow } from '@/types/database'

export default async function AdminCorporatePage() {
  const { supabase } = await requireAdmin()

  // Fetch corporate accounts
  const { data: accounts, error } = await supabase
    .from('corporate_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500">Error loading corporate accounts: {error.message}</div>
  }

  const allAccounts = (accounts ?? []) as CorporateAccountRow[]

  // Calculate stats
  const active = allAccounts.filter(a => a.status === 'active').length
  const totalRetainer = allAccounts.reduce((sum, a) => sum + Number(a.retainer_amount || 0), 0)
  const guaranteedVehicles = allAccounts.reduce((sum, a) => sum + Number(a.guaranteed_vehicles || 0), 0)

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">B2B Management</p>
        <h1 className="mt-2 text-3xl font-bold">Corporate Accounts</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Manage retainer clients and guaranteed availability contracts.</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Building2 className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Active Clients</p>
              <p className="text-2xl font-bold">{active}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Total Retainer Value</p>
              <p className="text-2xl font-bold">AED {totalRetainer.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Guaranteed Vehicles</p>
              <p className="text-2xl font-bold">{guaranteedVehicles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="mb-8">
        <CorporateForm />
      </div>
      {allAccounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <h2 className="mt-4 font-semibold">No corporate accounts yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Add your first B2B retainer client to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allAccounts.map((account) => (
            <div key={account.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                    <Building2 className="h-6 w-6 text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{account.company_name}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        account.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                        {account.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Contact: {account.contact_person} · {account.contact_phone}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Trade License: {account.trade_license || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--muted-foreground)]">Monthly Retainer</p>
                  <p className="text-lg font-bold">AED {Number(account.retainer_amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {account.guaranteed_vehicles || 0} Vehicles Guaranteed
                  </p>
                  <div className="mt-2">
                    <CorporateActions id={account.id} status={account.status} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}