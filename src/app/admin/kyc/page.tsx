import {
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { approveDocument, rejectDocument, toggleBlacklist } from './actions'

function labelForType(type: string) {
  switch (type) {
    case 'emirates_id':
      return 'Emirates ID'
    case 'driving_license':
      return 'Driving License'
    case 'passport':
      return 'Passport'
    case 'visa':
      return 'Visa'
    default:
      return type
  }
}

function statusBadge(status: string) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
        Approved
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600">
        <XCircle className="h-4 w-4" />
        Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
      <Clock3 className="h-4 w-4" />
      Pending
    </span>
  )
}

export default async function AdminKycPage() {
  // ⚡ requireAdmin already fetches user + profile in one go
  const { supabase } = await requireAdmin()

  const { data: documents, error } = await supabase
    .from('documents')
    .select(`
      id,
      user_id,
      type,
      status,
      storage_path,
      rejection_reason,
      reviewed_at,
      created_at,
      profiles:user_id ( full_name, email, is_blacklisted )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <main className="p-6 sm:p-8">
        <h1 className="text-3xl font-bold">KYC Review</h1>
        <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-500">
          Error: {error.message}
        </p>
      </main>
    )
  }

  const all = documents ?? []
  const pending = all.filter((d) => d.status === 'pending')
  const approved = all.filter((d) => d.status === 'approved')
  const rejected = all.filter((d) => d.status === 'rejected')

  const grouped = new Map<
    string,
    {
      customer: { full_name?: string; email?: string; is_blacklisted?: boolean } | null
      documents: typeof all
    }
  >()

  for (const doc of all) {
    const customerRaw = Array.isArray(doc.profiles) ? doc.profiles[0] : doc.profiles
    const existing = grouped.get(doc.user_id)
    if (existing) {
      existing.documents.push(doc)
    } else {
      grouped.set(doc.user_id, {
        customer: customerRaw ?? null,
        documents: [doc],
      })
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Compliance
        </p>
        <h1 className="mt-2 text-3xl font-bold">KYC Review</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Review customer documents and approve or reject KYC verification.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            <Clock3 className="h-4 w-4 text-amber-500" />
            Pending
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-600">{pending.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Approved
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{approved.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            <XCircle className="h-4 w-4 text-red-500" />
            Rejected
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">{rejected.length}</p>
        </div>
      </div>

      {all.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-14 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-lg font-semibold">No documents yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Customer KYC documents will appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([userId, group]) => (
            <div
              key={userId}
              className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
            >
              {/* Customer header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--muted)]/30 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
                    {(group.customer?.full_name ?? 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">
                        {group.customer?.full_name ?? 'Unknown customer'}
                      </p>
                      {group.customer?.is_blacklisted && (
                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                          Blacklisted
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                      {group.customer?.email ?? 'No email'}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/admin/kyc/${userId}`}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-xs font-semibold transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
                >
                  View all documents
                </Link>
              </div>

              {/* Documents */}
              <div className="divide-y divide-[var(--border)]">
                {group.documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)]/50">
                        <FileText className="h-5 w-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{labelForType(doc.type)}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          Uploaded {new Date(doc.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {doc.rejection_reason && (
                          <p className="mt-1 text-xs text-red-600">
                            {doc.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {statusBadge(doc.status)}
                      {doc.status === 'pending' && (
                        <>
                          <form action={async () => {
                            'use server'
                            await approveDocument(doc.id)
                          }}>
                            <button
                              type="submit"
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:bg-emerald-600"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          </form>
                          <form action={async (formData: FormData) => {
                            'use server'
                            const reason = String(formData.get('reason') ?? '')
                            await rejectDocument(doc.id, reason)
                          }}>
                            <input type="hidden" name="reason" value="Document not acceptable" />
                            <button
                              type="submit"
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/5 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-500/10"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {group.documents.length > 3 && (
                  <p className="p-3 text-center text-xs text-[var(--muted-foreground)]">
                    + {group.documents.length - 3} more documents
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}