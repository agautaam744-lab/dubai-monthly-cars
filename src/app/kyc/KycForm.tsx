'use client'

import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileUp,
  ShieldCheck,
  XCircle,
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
  }
> = {
  emirates_id: {
    title: 'Emirates ID',
    description:
      'Upload a clear front/back scan or PDF of your Emirates ID.',
    accept: 'image/jpeg,image/png,application/pdf',
  },
  driving_license: {
    title: 'Driving License',
    description:
      'Upload your driving license or accepted license document.',
    accept: 'image/jpeg,image/png,application/pdf',
  },
  passport: {
    title: 'Passport',
    description:
      'Upload a clear passport identity page.',
    accept: 'image/jpeg,image/png,application/pdf',
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

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

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

      if (uploadError) {
        throw uploadError
      }

      const { data, error: dbError } =
        await supabase
          .from('documents')
          .insert({
            user_id: userId,
            type,
            storage_path: path,
            status: 'pending',
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

  return (
    <div className="space-y-6">
      <div className="flex gap-4 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-5">
        <ShieldCheck className="h-6 w-6 shrink-0 text-[var(--accent)]" />

        <div>
          <h2 className="font-semibold">
            Your documents are protected
          </h2>

          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Your KYC files are stored in a private storage bucket.
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-[var(--success)]/10 p-4 text-sm text-[var(--success)]">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {documentTypes.map((type) => {
        const document = latestDocument(type)
        const meta = documentMeta[type]
        const isUploading = uploading === type

        return (
          <div
            key={type}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <FileCheck2 className="h-6 w-6 text-[var(--accent)]" />
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold">
                      {meta.title}
                    </h2>

                    {document && (
                      <StatusBadge status={document.status} />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {meta.description}
                  </p>

                  {document?.rejection_reason && (
                    <p className="mt-2 text-sm text-[var(--danger)]">
                      Reason: {document.rejection_reason}
                    </p>
                  )}
                </div>
              </div>

              <label className="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)]">
                <FileUp className="h-4 w-4" />

                {isUploading
                  ? 'Uploading...'
                  : document?.status === 'rejected'
                    ? 'Upload again'
                    : document?.status === 'approved'
                      ? 'Approved'
                      : 'Upload document'}

                <input
                  type="file"
                  accept={meta.accept}
                  disabled={
                    isUploading ||
                    document?.status === 'pending' ||
                    document?.status === 'approved'
                  }
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]

                    if (file) {
                      uploadDocument(type, file)
                    }

                    event.target.value = ''
                  }}
                />
              </label>
            </div>
          </div>
        )
      })}

      <div className="rounded-2xl bg-[var(--muted)] p-5">
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-semibold">KYC status</h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {documentTypes.map((type) => {
            const document = latestDocument(type)

            return (
              <div
                key={type}
                className="rounded-xl bg-[var(--card)] p-4"
              >
                <p className="text-xs text-[var(--muted-foreground)]">
                  {documentMeta[type].title}
                </p>

                <p className="mt-2 font-semibold">
                  {document?.status ?? 'Not uploaded'}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: DocumentRow['status']
}) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--success)]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--danger)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--danger)]">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--warning)]">
      <Clock3 className="h-3.5 w-3.5" />
      Pending
    </span>
  )
}