'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count: c } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setCount(c ?? 0)
    }

    load()

    // Refresh every 60 seconds
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return (
      <Link
        href="/notifications"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
      </Link>
    )
  }

  return (
    <Link
      href="/notifications"
      className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}