import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy', { locale: es })
}

export function formatDateRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function feelingEmoji(score: number | null): string {
  const map: Record<number, string> = {
    1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄',
  }
  return score ? map[score] ?? '—' : '—'
}

export function scoreColor(score: number, max = 300): string {
  const pct = score / max
  if (pct >= 0.9) return 'text-green-600 dark:text-green-400'
  if (pct >= 0.75) return 'text-brand-600 dark:text-brand-400'
  if (pct >= 0.6) return 'text-amber-600 dark:text-amber-400'
  return 'text-slate-500'
}
