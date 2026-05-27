'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, PlusCircle, History, Trophy, TrendingUp,
  UserCircle, Target, LogOut, Users, Medal, MoreHorizontal, X, Bell,
} from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { NotificationBadge } from './NotificationBadge'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 p-4">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-2 mb-6">
        <img src="/logo.png" alt="ArcoLog" className="h-12 w-12 shrink-0 rounded-xl object-contain" />
        <span className="font-semibold text-slate-900 dark:text-white">ArcoLog</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-2">Menú</p>
        {[
          { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
          { href: '/training/new', label: 'Nuevo entreno', icon: PlusCircle },
          { href: '/training/history', label: 'Historial', icon: History },
          { href: '/competitions/new', label: 'Nueva competición', icon: Trophy },
          { href: '/competitions/history', label: 'Competiciones', icon: Trophy },
          { href: '/progress', label: 'Progreso', icon: TrendingUp },
          { href: '/achievements', label: 'Logros', icon: Medal },
          { href: '/groups', label: 'Grupos', icon: Users },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('nav-link', pathname === item.href && 'active')}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
	  <NotificationBadge />
      <div className="space-y-0.5 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Link href="/profile" className={cn('nav-link', pathname === '/profile' && 'active')}>
          <UserCircle className="w-4 h-4 shrink-0" />
          Perfil
        </Link>
        <form action={logout}>
          <button type="submit" className="nav-link w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="w-4 h-4 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const mainNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
    { href: '/training/new', icon: PlusCircle, label: 'Entreno' },
    { href: '/progress', icon: TrendingUp, label: 'Progreso' },
    { href: '/groups', icon: Users, label: 'Grupos' },
  ]

  const moreNav = [
    { href: '/training/history', icon: History, label: 'Historial' },
    { href: '/competitions/new', icon: Trophy, label: 'Nueva comp.' },
    { href: '/competitions/history', icon: Trophy, label: 'Competiciones' },
    { href: '/achievements', icon: Medal, label: 'Logros' },
    { href: '/notifications', icon: Bell, label: 'Avisos' },
    { href: '/profile', icon: UserCircle, label: 'Perfil' },
  ]

  return (
    <>
      {/* Panel "Más" */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div
            className="absolute bottom-16 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 grid grid-cols-4 gap-3"
            onClick={e => e.stopPropagation()}
          >
            {moreNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors text-xs',
                  pathname === item.href
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-center leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Barra inferior */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-2">
        {mainNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors text-xs',
              pathname === item.href
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 dark:text-slate-500'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors text-xs',
            showMore
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-slate-400 dark:text-slate-500'
          )}
        >
          {showMore ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          <span>Más</span>
        </button>
      </nav>
    </>
  )
}