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
  TrendingUp,
  Wrench,
  Briefcase,
  AlertTriangle,
  Megaphone,
  CalendarClock,
  Users2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/kyc', label: 'KYC Review', icon: FileCheck },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/booking-changes', label: 'Changes', icon: CalendarClock },
  { href: '/admin/fleet', label: 'Fleet', icon: Car },
  { href: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/admin/corporate', label: 'Corporate', icon: Briefcase },
  { href: '/admin/damage', label: 'Damage', icon: AlertTriangle },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/finance', label: 'Finance', icon: DollarSign },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/admin/customers', label: 'Customers', icon: Users2 },
  { href: '/admin/staff', label: 'Staff', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r border-[var(--border)] bg-[var(--card)] lg:block">
      <nav className="sticky top-0 space-y-1 p-3">
        {links.map((link) => {
          const Icon = link.icon
          const active =
            pathname === link.href ||
            (link.href !== '/admin' && pathname?.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                active
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'text-[var(--foreground)]/70 hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
// force redeploy 2026-10-02-21-36-14