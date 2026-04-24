'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Session {
  id: string
  session_date: string
  total_arrows: number
  distance_meters: number
  modality?: string
}

interface Props {
  sessions: Session[]
}

function toLocalDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function TrainingHeatmap({ sessions }: Props) {
  const router = useRouter()
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {}
    for (const s of sessions) {
      if (!map[s.session_date]) map[s.session_date] = []
      map[s.session_date].push(s)
    }
    return map
  }, [sessions])

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
    month: 'long',
    year: 'numeric',
  })

  const today = toLocalDateString(now.getFullYear(), now.getMonth(), now.getDate())
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  function prevMonth() {
    setSelectedDay(null)
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  function nextMonth() {
    setSelectedDay(null)
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  function getDayColor(date: string): string {
    const count = sessionsByDate[date]?.length ?? 0
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
    if (count === 1) return 'bg-amber-200 dark:bg-amber-700 hover:bg-amber-300'
    if (count === 2) return 'bg-amber-400 dark:bg-amber-500 hover:bg-amber-500'
    return 'bg-amber-600 dark:bg-amber-400 hover:bg-amber-700'
  }

  function handleDayClick(date: string) {
    const daySessions = sessionsByDate[date]
    if (!daySessions || daySessions.length === 0) return
    if (daySessions.length === 1) {
      router.push(`/training/${daySessions[0].id}`)
    } else {
      setSelectedDay(selectedDay === date ? null : date)
    }
  }

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>

        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{monthName}</p>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-200 dark:bg-amber-700" />
            <span className="text-xs text-slate-400">1</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-500" />
            <span className="text-xs text-slate-400">2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-400" />
            <span className="text-xs text-slate-400">3+</span>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-1"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}

        {calendarDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />
          const count = sessionsByDate[date]?.length ?? 0
          const isToday = date === today
          const isSelected = selectedDay === date
          const dayNum = parseInt(date.split('-')[2])

          return (
            <div key={date} className="relative">
              <button
                type="button"
                onClick={() => handleDayClick(date)}
                className={`w-full aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-all ${getDayColor(date)} ${
                  isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''
                } ${count > 0 ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={count > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                  {dayNum}
                </span>
                {count > 1 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-amber-700 dark:bg-amber-300 text-white dark:text-amber-900 rounded-full text-[9px] flex items-center justify-center font-bold">
                    {count}
                  </span>
                )}
              </button>

              {isSelected && count > 1 && (
                <div className="absolute top-full left-0 z-20 mt-1 w-48 card p-2 shadow-lg space-y-1">
                  {sessionsByDate[date].map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => router.push(`/training/${s.id}`)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <p className="text-xs font-medium text-slate-900 dark:text-white">
                        Sesión {idx + 1}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s.total_arrows} flechas · {s.distance_meters > 0 ? `${s.distance_meters}m` : 'recorrido'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
