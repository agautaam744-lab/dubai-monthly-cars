import {
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { approveDocument, rejectDocument, toggleBlacklist } from './actions'

function labelForType(type: string) {
  switch (type) {
    case 'emirates_id':
      return 'Emirates ID'
    case 'driving_license':
      return 'Driving License'
    case 'passport':
      return 'Passport'
    default:
      return type
  }
}

function statusBadge(status: string) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        Approved
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600">
        <XCircle className="h-4 w-4" />
        Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
      <Clock3 className="h-4 w-4" />
      Pending
    </span>
  )
}

export default async function AdminKycPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen p-10">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const adminRoles = ['super_admin', 'support', 'fleet_manager']

  if (!profile || !adminRoles.includes(profile.role)) {
    return (
      <main className="min-h-screen p-10">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-slate-500">
          You do not have permission to review KYC documents.
        </p>
      </main>
    )
  }

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

  if (error) {
    throw new Error(error.message)
  }

  const enrichedDocuments = await Promise.all(
    (documents ?? []).map(async (document) => {
      const { data: signed } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(document.storage_path, 60 * 10)

      return {
        ...document,
        signedUrl: signed?.signedUrl ?? null,
      }
    })
  )

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold">KYC Review</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Review customer identity documents and approve or reject them securely.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">
            Total documents
          </p>
          <p className="mt-2 text-3xl font-bold">
            {enrichedDocuments.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {
              enrichedDocuments.filter((item) => item.status === 'pending')
                .length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Approved</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {
              enrichedDocuments.filter((item) => item.status === 'approved')
                .length
            }
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {enrichedDocuments.map((document) => {
          const customer = Array.isArray(document.profiles)
            ? document.profiles[0]
            : document.profiles

          return (
            <article
              key={document.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                    <FileText className="h-6 w-6 text-[var(--accent)]" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold">
                        {labelForType(document.type)}
                      </h2>
                      {statusBadge(String(document.status))}
                    </div>

                    <p className="mt-1 text-sm">
                      {customer?.full_name || 'Customer'}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {customer?.email || 'No email'}
                    </p>

                    {document.rejection_reason && (
                      <p className="mt-2 text-sm text-red-600">
                        Reason: {document.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {document.signedUrl && (
                    <Link
                      href={document.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:border-[var(--accent)]"
                    >
                      View document
                    </Link>
                  )}

                  <form
                    action={async () => {
                      'use server'
                      await toggleBlacklist(document.user_id, !customer?.is_blacklisted)
                    }}
                  >
                    <button
                      type="submit"
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        customer?.is_blacklisted
                          ? 'border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20'
                          : 'border-[var(--border)] hover:border-red-400 hover:text-red-500'
                      }`}
                    >
                      {customer?.is_blacklisted ? 'Remove Blacklist' : 'Blacklist Customer'}
                    </button>
                  </form>

                  {document.status === 'pending' && (
                    <>
                      <form
                        action={async () => {
                          'use server'
                          await approveDocument(document.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Approve
                        </button>
                      </form>

                      <form
                        action={async (formData) => {
                          'use server'
                          const reason = String(formData.get('reason') ?? '')
                          await rejectDocument(document.id, reason)
                        }}
                        className="flex gap-2"
                      >
                        <input
                          name="reason"
                          required
                          placeholder="Rejection reason"
                          className="w-48 rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </article>
          )
        })}

        {enrichedDocuments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <p className="font-semibold">No KYC documents found</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Uploaded customer documents will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
