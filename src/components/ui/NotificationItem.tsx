'use client'

import { useState } from 'react'
import { markAsRead, deleteNotification } from '@/lib/actions/notifications'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface Props {
  notification: {
    id: string
    type: string
    title: string
    message: string
    read: boolean
    created_at: string
  }
}

export function NotificationItem({ notification }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRead() {
    if (notification.read) return
    setLoading(true)
    await markAsRead(notification.id)
    router.refresh()
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    await deleteNotification(notification.id)
    router.refresh()
    setLoading(false)
  }

  const timeAgo = new Date(notification.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div
      className={`flex items-start gap-4 px-5 py-4 transition-colors ${
        !notification.read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
      }`}
      onClick={handleRead}
    >
      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
        !notification.read ? 'bg-brand-500' : 'bg-transparent'
      }`} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-slate-900 dark:text-white ${
          !notification.read ? 'font-semibold' : ''
        }`}>
          {notification.title}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
      </div>

      <button
        type="button"
        onClick={e => { e.stopPropagation(); handleDelete() }}
        disabled={loading}
        className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}