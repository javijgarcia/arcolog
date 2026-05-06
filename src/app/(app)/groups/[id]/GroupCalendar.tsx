'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MODALITY_LABELS } from '@/types'

interface ScheduledTraining {
  id: string
  scheduled_date: string
  modality: string | null
  objective: string | null
}

interface ActivitySession {
  session_date: string
  user_id: string
  total_arrows: number
  profiles: { full_name: string | null } | null
}

interface Props {
  scheduled: ScheduledTraining[]
  activity: ActivitySession[]
}

function toLocalDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function GroupCalendar({ scheduled, activity }: Props) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const scheduledByDate = useMemo(() => {
    const map: Record<string, ScheduledTraining[]> = {}
    for (const s of scheduled) {
      if (!map[s.scheduled_date]) map[s.scheduled_date] = []
      map[s.scheduled_date].push(s)
    }
    return map
  }, [scheduled])

  const activityByDate = useMemo(() => {
    const map: Record<string, ActivitySession[]> = {}
    for (const a of activity) {
      if (!map[a.session_date]) map[a.session_date] = []
      map[a.session_date].push(a)
    }
    return map
  }, [activity])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    let startDow = firstDay.getDay()
    startDow = startDow === 0 ? 6 : startDow - 1
    const days: (string | null)[] = Array(startDow).fill(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(toLocalDateString(viewYear, viewMonth, d))
    }
    return days
  }, [viewYear, viewMonth])

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('es-ES', {
    month: 'long', year: 'numeric',
  })

  const today = toLocalDateString(now.getFullYear(), now.getMonth(), now.getDate())
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  function prevMonth() {
    setSelectedDay(null)
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    setSelectedDay(null)
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  const selectedScheduled = selectedDay ? scheduledByDate[selectedDay] ?? [] : []
  const selectedActivity = selectedDay ? activityByDate[selectedDay] ?? [] : []

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{monthName}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span className="text-xs text-slate-400">Programado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-400">Entrenado</span>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}

        {calendarDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />

          const hasScheduled = !!scheduledByDate[date]?.length
          const hasActivity = !!activityByDate[date]?.length
          const isToday = date === today
          const isSelected = selectedDay === date
          const dayNum = parseInt(date.split('-')[2])
          const hasAny = hasScheduled || hasActivity

          return (
            <div key={date} className="relative">
              <button
                type="button"
                onClick={() => hasAny ? setSelectedDay(isSelected ? null : date) : null}
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all ${
                  isSelected
                    ? 'ring-2 ring-brand-500 ring-offset-1'
                    : ''
                } ${
                  hasScheduled && hasActivity
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : hasScheduled
                    ? 'bg-brand-100 dark:bg-brand-900/30'
                    : hasActivity
                    ? 'bg-amber-100 dark:bg-amber-900/30'
                    : 'bg-slate-50 dark:bg-slate-800'
                } ${
                  isToday ? 'ring-2 ring-brand-500' : ''
                } ${hasAny ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`${
                  hasScheduled && hasActivity ? 'text-purple-700 dark:text-purple-300'
                  : hasScheduled ? 'text-brand-700 dark:text-brand-300'
                  : hasActivity ? 'text-amber-700 dark:text-amber-300'
                  : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {dayNum}
                </span>
                <div className="flex gap-0.5 mt-0.5">
                  {hasScheduled && <div className="w-1 h-1 rounded-full bg-brand-500" />}
                  {hasActivity && <div className="w-1 h-1 rounded-full bg-amber-400" />}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Panel detalle del día */}
      {selectedDay && (selectedScheduled.length > 0 || selectedActivity.length > 0) && (
        <div className="card p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {selectedScheduled.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-brand-600 dark:text-brand-400">🔵 Programado</p>
              {selectedScheduled.map(s => (
                <div key={s.id} className="bg-brand-50 dark:bg-brand-900/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {s.modality ? MODALITY_LABELS[s.modality as keyof typeof MODALITY_LABELS] : 'Sin modalidad'}
                    {s.objective ? ` · ${s.objective}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}

          {selectedActivity.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">🟠 Entrenamientos realizados</p>
              {selectedActivity.map((a, i) => (
                <div key={i} className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 flex justify-between">
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {(a.profiles as any)?.full_name ?? 'Arquero'}
                  </p>
                  <p className="text-xs text-slate-500">{a.total_arrows} flechas</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}