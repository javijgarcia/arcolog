import { getNotifications, markAllAsRead } from '@/lib/actions/notifications'
import { NotificationItem } from '@/components/ui/NotificationItem'
import { Bell } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notificaciones' }

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Notificaciones</h1>
          {unread > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{unread} sin leer</p>
          )}
        </div>
        {unread > 0 && (
          <form action={markAllAsRead as any}>
            <button type="submit" className="btn-secondary text-sm py-2">
              Marcar todas como leídas
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.map((n: any) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  )
}