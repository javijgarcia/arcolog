'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUnreadCount } from '@/lib/actions/notifications'

export function NotificationBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    getUnreadCount().then(setCount)
    const interval = setInterval(() => {
      getUnreadCount().then(setCount)
    }, 30000) // Actualiza cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  return (
    <Link href="/notifications" className="nav-link relative">
      <Bell className="w-4 h-4 shrink-0" />
      Notificaciones
      {count > 0 && (
        <span className="ml-auto bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}