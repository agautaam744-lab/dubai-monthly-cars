import Link from 'next/link'
import { LayoutDashboard, LogOut } from 'lucide-react'
import AdminSidebar from './AdminSidebar'
import { requireAdmin } from '@/lib/admin'
import { adminLogout } from '../admin-login/actions'

export const metadata = {
  title: 'Admin Panel | Dubai Monthly Cars',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { fullName, role } = await requireAdmin()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-semibold"
            >
              <LayoutDashboard className="h-5 w-5 text-[var(--accent)]" />
              <span className="hidden sm:inline">Admin Panel</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{fullName ?? 'Admin'}</p>
              <p className="text-xs capitalize text-[var(--muted-foreground)]">
                {role.replace('_', ' ')}
              </p>
            </div>

            <form action={adminLogout}>
              <button
                type="submit"
                className="flex min-h-[40px] items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-xs font-medium transition hover:bg-[var(--muted)]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit Admin</span>
              </button>
            </form>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-2 py-2 lg:hidden">
          {[
            { href: '/admin', label: 'Dashboard' },
            { href: '/admin/kyc', label: 'KYC' },
            { href: '/admin/bookings', label: 'Bookings' },
            { href: '/admin/fleet', label: 'Fleet' },
            { href: '/admin/finance', label: 'Finance' },
            { href: '/admin/staff', label: 'Staff' },
            { href: '/admin/reports', label: 'Reports' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-[var(--foreground)]/75 transition hover:bg-[var(--muted)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
