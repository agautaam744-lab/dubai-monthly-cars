import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KycForm from './KycForm'

export default async function KycPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: documents } = await supabase
    .from('documents')
    .select(`
      id,
      type,
      status,
      rejection_reason,
      expires_at,
      created_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* CINEMATIC HEADER */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--muted)] to-[var(--background)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(201,162,39,0.15),transparent)]"
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20 lg:px-8 lg:pb-14 lg:pt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Customer Verification
          </p>

          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
            Complete your KYC
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--foreground)]/70">
            Upload the documents required to verify your identity before completing your monthly rental booking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <KycForm
          userId={user.id}
          documents={documents ?? []}
        />
      </section>
    </main>
  )
}