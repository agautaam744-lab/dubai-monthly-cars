'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileCheck,
  CalendarCheck,
  Car,
  DollarSign,
  Users,
  BarChart3,
  ChevronLeft,
  TrendingUp,
  Wrench,
  Briefcase, // <-- Corporate ke liye icon add kiya
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/kyc', label: 'KYC Review', icon: FileCheck },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/fleet', label: 'Fleet', icon: Car },
  { href: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/admin/corporate', label: 'Corporate', icon: Briefcase }, // <-- Naya Corporate link add kiya
  { href: '/admin/finance', label: 'Finance', icon: DollarSign },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/admin/staff', label: 'Staff', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-[var(--border)] p-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to site
          </Link>
          <h2 className="mt-3 text-lg font-bold">Admin Panel</h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Dubai Monthly Cars
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map((link) => {
            const Icon = link.icon
            const active =
              link.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--foreground)]/75 hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}