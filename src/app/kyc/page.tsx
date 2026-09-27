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
      <section className="border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Customer Verification
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Complete your KYC
          </h1>

          <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
            Upload the documents required to verify your identity
            before completing your rental booking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <KycForm
          userId={user.id}
          documents={documents ?? []}
        />
      </section>
    </main>
  )
}