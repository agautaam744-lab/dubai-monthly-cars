'use client'

import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileUp,
  ShieldCheck,
  XCircle,
  Sparkles,
  IdCard,
  CreditCard,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type DocumentType =
  | 'emirates_id'
  | 'driving_license'
  | 'passport'

type DocumentRow = {
  id: string
  type: DocumentType
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  expires_at: string | null
  created_at: string
}

type Props = {
  userId: string
  documents: DocumentRow[]
}

const documentMeta: Record<
  DocumentType,
  {
    title: string
    description: string
    accept: string
    icon: typeof IdCard
  }
> = {
  emirates_id: {
    title: 'Emirates ID',
    description:
      'Upload a clear front/back scan or PDF of your Emirates ID.',
    accept: 'image/jpeg,image/png,application/pdf',
    icon: IdCard,
  },
  driving_license: {
    title: 'Driving License',
    description:
      'Upload your UAE or international driving license.',
    accept: 'image/jpeg,image/png,application/pdf',
    icon: CreditCard,
  },
  passport: {
    title: 'Passport',
    description:
      'Upload a clear passport identity page.',
    accept: 'image/jpeg,image/png,application/pdf',
    icon: BookOpen,
  },
}

const documentTypes: DocumentType[] = [
  'emirates_id',
  'driving_license',
  'passport',
]

export default function KycForm({
  userId,
  documents: initialDocuments,
}: Props) {
  const supabase = createClient()

  const [documents, setDocuments] =
    useState<DocumentRow[]>(initialDocuments)

  const [uploading, setUploading] =
    useState<DocumentType | null>(null)

  const [expiry, setExpiry] = useState<Record<DocumentType, string>>({
    emirates_id: '',
    driving_license: '',
    passport: '',
  })

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const latestDocument = (type: DocumentType) =>
    documents.find((document) => document.type === type)

  const uploadDocument = async (
    type: DocumentType,
    file: File,
  ) => {
    setError('')
    setMessage('')

    if (file.size > 10 * 1024 * 1024) {
      setError('Maximum file size is 10 MB.')
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG and PDF files are allowed.')
      return
    }

    setUploading(type)

    try {
      const extension =
        file.name.split('.').pop()?.toLowerCase() || 'bin'

      const path =
        `${userId}/${type}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } =
        await supabase.storage
          .from('kyc-documents')
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          })

      if (uploadError) throw uploadError

      const { data, error: dbError } =
        await supabase
          .from('documents')
          .insert({
            user_id: userId,
            type,
            storage_path: path,
            status: 'pending',
            expires_at: expiry[type] || null,
          })
          .select(`
            id,
            type,
            status,
            rejection_reason,
            expires_at,
            created_at
          `)
          .single()

      if (dbError) {
        await supabase.storage
          .from('kyc-documents')
          .remove([path])
        throw dbError
      }

      setDocuments((current) => [
        data as DocumentRow,
        ...current,
      ])

      setMessage(
        `${documentMeta[type].title} uploaded successfully.`
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Upload failed.',
      )
    } finally {
      setUploading(null)
    }
  }

  // Progress computation
  const statuses = documentTypes.map(
    (t) => latestDocument(t)?.status ?? 'missing'
  )
  const approvedCount = statuses.filter((s) => s === 'approved').length
  const pendingCount = statuses.filter((s) => s === 'pending').length
  const totalRequired = documentTypes.length
  const progressPercent = Math.round((approvedCount / totalRequired) * 100)

  return (
    <div className="space-y-8">
      {/* PROGRESS STRIP */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Verification progress
            </p>
            <p className="mt-1 font-serif text-xl tracking-tight">
              {approvedCount} of {totalRequired} documents approved
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {pendingCount} in review
              </span>
            )}
          </div>
        </div>

        <div className="h-1.5 w-full bg-[var(--muted)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent)] to-amber-400 transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* SECURITY NOTE */}
      <div className="flex gap-4 rounded-2xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 to-transparent p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
          <ShieldCheck className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold">Your documents are encrypted and protected</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--foreground)]/70">
            Files are stored in a private, encrypted bucket with strict access rules. Only verification staff can view them.
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-700">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {/* DOCUMENT CARDS */}
      <div className="space-y-4">
        {documentTypes.map((type, idx) => {
          const document = latestDocument(type)
          const meta = documentMeta[type]
          const isUploading = uploading === type
          const Icon = meta.icon
          const isApproved = document?.status === 'approved'
          const isPending = document?.status === 'pending'
          const isRejected = document?.status === 'rejected'

          return (
            <div
              key={type}
              className={`group relative overflow-hidden rounded-2xl border bg-[var(--card)] p-6 transition-all duration-300 ${
                isApproved
                  ? 'border-emerald-500/40'
                  : isRejected
                    ? 'border-red-500/40'
                    : isPending
                      ? 'border-amber-500/40'
                      : 'border-[var(--border)] hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-md'
              }`}
            >
              {/* Step number */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -end-6 -top-8 font-serif text-[120px] leading-none text-[var(--accent)]/[0.04]"
              >
                {idx + 1}
              </span>

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
                      isApproved
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : isRejected
                          ? 'border-red-500/30 bg-red-500/10'
                          : isPending
                            ? 'border-amber-500/30 bg-amber-500/10'
                            : 'border-[var(--border)] bg-[var(--muted)]/40'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isApproved
                          ? 'text-emerald-500'
                          : isRejected
                            ? 'text-red-500'
                            : isPending
                              ? 'text-amber-500'
                              : 'text-[var(--accent)]'
                      }`}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-serif text-xl tracking-tight">
                        {meta.title}
                      </h2>
                      {document && <StatusBadge status={document.status} />}
                    </div>

                    <p className="mt-1.5 text-sm leading-6 text-[var(--foreground)]/70">
                      {meta.description}
                    </p>

                    {document?.rejection_reason && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-700">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>
                          <strong className="font-semibold">Rejected:</strong>{' '}
                          {document.rejection_reason}
                        </span>
                      </div>
                    )}

                    {document?.expires_at && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                        <Clock3 className="h-3 w-3" aria-hidden="true" />
                        Expires {new Date(document.expires_at).toLocaleDateString('en-AE')}
                      </p>
                    )}

                    {!document && (
                      <label className="mt-4 block text-xs">
                        <span className="mb-1.5 block font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                          Expiry date (optional)
                        </span>
                        <input
                          type="date"
                          value={expiry[type]}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={(e) =>
                            setExpiry((p) => ({
                              ...p,
                              [type]: e.target.value,
                            }))
                          }
                          className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--ring)]"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <label
                  className={`inline-flex min-h-[48px] shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-semibold transition-all ${
                    isApproved
                      ? 'cursor-not-allowed bg-emerald-500/10 text-emerald-700'
                      : isPending
                        ? 'cursor-not-allowed bg-amber-500/10 text-amber-700'
                        : 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-xl'
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : isPending ? (
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <FileUp className="h-4 w-4" aria-hidden="true" />
                  )}

                  {isUploading
                    ? 'Uploading...'
                    : isRejected
                      ? 'Re-upload'
                      : isApproved
                        ? 'Approved'
                        : isPending
                          ? 'In review'
                          : 'Upload'}

                  <input
                    type="file"
                    accept={meta.accept}
                    disabled={isUploading || isPending || isApproved}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) uploadDocument(type, file)
                      event.target.value = ''
                    }}
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>

      {/* TIMELINE SUMMARY */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="font-serif text-lg tracking-tight">Verification status</h2>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3">
          {documentTypes.map((type) => {
            const document = latestDocument(type)
            const status = document?.status ?? 'missing'
            const Icon = documentMeta[type].icon

            return (
              <div
                key={type}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/50 p-3"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    status === 'approved'
                      ? 'bg-emerald-500/10'
                      : status === 'pending'
                        ? 'bg-amber-500/10'
                        : status === 'rejected'
                          ? 'bg-red-500/10'
                          : 'bg-[var(--muted)]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      status === 'approved'
                        ? 'text-emerald-500'
                        : status === 'pending'
                          ? 'text-amber-500'
                          : status === 'rejected'
                            ? 'text-red-500'
                            : 'text-[var(--muted-foreground)]'
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">
                    {documentMeta[type].title}
                  </p>
                  <p
                    className={`mt-0.5 text-xs font-semibold capitalize ${
                      status === 'approved'
                        ? 'text-emerald-600'
                        : status === 'pending'
                          ? 'text-amber-600'
                          : status === 'rejected'
                            ? 'text-red-600'
                            : 'text-[var(--muted-foreground)]'
                    }`}
                  >
                    {status === 'missing' ? 'Not uploaded' : status}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {approvedCount === totalRequired && (
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-emerald-500/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-emerald-700">
                  All documents approved
                </p>
                <p className="text-xs text-[var(--foreground)]/70">
                  You can now complete your booking.
                </p>
              </div>
            </div>
            <a
              href="/cars"
              className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
            >
              Browse Cars
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: DocumentRow['status'] }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Approved
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
      Pending
    </span>
  )
}