'use client'

import { useState, useEffect } from 'react'
import { getGroupRanking } from '@/lib/actions/groups'
import { Target, TrendingUp, Flame, Trophy } from 'lucide-react'

type Period = 'semana' | 'mes' | 'año'
type SortBy = 'arrows' | 'avgScore' | 'streak'

interface RankingEntry {
  user_id: string
  full_name: string
  bow_type: string | null
  role: string
  totalArrows: number
  totalSessions: number
  avgScore: number
  personalBest: number
  streak: number
}

export function GroupRanking({ groupId }: { groupId: string }) {
  const [period, setPeriod] = useState<Period>('mes')
  const [sortBy, setSortBy] = useState<SortBy>('arrows')
  const [data, setData] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getGroupRanking(groupId, period).then(result => {
      setData(result as RankingEntry[])
      setLoading(false)
    })
  }, [groupId, period])

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'arrows') return b.totalArrows - a.totalArrows
    if (sortBy === 'avgScore') return b.avgScore - a.avgScore
    return b.streak - a.streak
  })

  const periods: { key: Period; label: string }[] = [
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Mes' },
    { key: 'año', label: 'Año' },
  ]

  const sortOptions: { key: SortBy; label: string; icon: any }[] = [
    { key: 'arrows', label: 'Flechas', icon: Target },
    { key: 'avgScore', label: 'Media', icon: TrendingUp },
    { key: 'streak', label: 'Racha', icon: Flame },
  ]

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {periods.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {sortOptions.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSortBy(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                sortBy === s.key
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Cargando...</div>
      ) : sorted.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          No hay actividad en este periodo
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((entry, idx) => (
            <div key={entry.user_id} className="card px-4 py-3 flex items-center gap-3">
              <span className="text-xl w-8 text-center">
                {medals[idx] ?? `${idx + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                  {entry.full_name}
                  {entry.role === 'entrenador' && <span className="text-xs text-slate-400 ml-1">🧑‍🏫</span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {entry.totalSessions} sesiones
                  {entry.streak > 0 ? ` · 🔥 ${entry.streak} días` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                {sortBy === 'arrows' && (
                  <>
                    <p className="font-bold text-slate-900 dark:text-white">{entry.totalArrows.toLocaleString('es-ES')}</p>
                    <p className="text-xs text-slate-400">flechas</p>
                  </>
                )}
                {sortBy === 'avgScore' && (
                  <>
                    <p className="font-bold text-slate-900 dark:text-white">{entry.avgScore || '—'}</p>
                    <p className="text-xs text-slate-400">media</p>
                  </>
                )}
                {sortBy === 'streak' && (
                  <>
                    <p className="font-bold text-slate-900 dark:text-white">{entry.streak}</p>
                    <p className="text-xs text-slate-400">días racha</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}