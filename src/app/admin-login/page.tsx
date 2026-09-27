import { ShieldCheck, Lock } from 'lucide-react'
import AdminLoginForm from './AdminLoginForm'

export const metadata = {
  title: 'Admin Login | Dubai Monthly Cars',
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]">
            <ShieldCheck className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <h1 className="mt-5 text-3xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Restricted access - authorized personnel only
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-[var(--muted)]/50 p-3 text-xs text-[var(--muted-foreground)]">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>This area is for staff only. All login attempts are logged.</span>
          </div>

          <AdminLoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          Admin Portal - Dubai Monthly Cars
        </p>
      </div>
    </main>
  )
}
