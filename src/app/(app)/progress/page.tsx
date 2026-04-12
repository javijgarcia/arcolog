import { getProgressData } from '@/lib/actions/profile'
import { getTrainingSessions } from '@/lib/actions/training'
import { getCompetitionScores } from '@/lib/actions/competitions'
import { ProgressChart } from '@/components/progress/ProgressChart'
import { TrendingUp, Target, Trophy, Zap } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Progreso' }

export default async function ProgressPage() {
  const [progressData, sessions, competitions] = await Promise.all([
    getProgressData(),
    getTrainingSessions(),
    getCompetitionScores(),
  ])

  const totalArrows = sessions.reduce((s: number, sess: any) => s + (sess.total_arrows ?? 0), 0)
  const personalBest = competitions.length
    ? Math.max(...competitions.map((c: any) => c.total_score))
    : null

  // Últimos 10 entrenos con puntuación
  const recentScores = sessions
    .filter((s: any) => s.session_ends && s.session_ends.length > 0)
    .slice(0, 10)
    .map((s: any) => ({
      date: s.session_date,
      score: s.session_ends.reduce((sum: number, e: any) => sum + e.score, 0),
    }))

  const avgTrainingScore = recentScores.length
    ? Math.round(recentScores.reduce((s, r) => s + r.score, 0) / recentScores.length)
    : null

  const trend = recentScores.length >= 2
    ? recentScores[0].score - recentScores[recentScores.length - 1].score
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1>Mi progreso</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Evolución de tus puntuaciones de entrenamiento y competición
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-2">
            <Target className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{totalArrows.toLocaleString('es-ES')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Flechas totales</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{personalBest ?? '—'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Mejor marca</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{avgTrainingScore ?? '—'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Media entreno</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-2">
            <Zap className="w-4 h-4 text-green-500" />
          </div>
          <p className={`text-xl font-bold ${trend === null ? 'text-slate-900 dark:text-white' : trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {trend === null ? '—' : `${trend >= 0 ? '+' : ''}${trend}`}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tendencia (últ. 10)</p>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
          Evolución de puntuaciones
        </h2>
        {progressData.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Las gráficas aparecerán cuando registres sesiones con tandas.
            </p>
          </div>
        ) : (
          <ProgressChart data={progressData} />
        )}
      </div>

      {/* Competition table */}
      {competitions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Histórico de competiciones</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {competitions.slice(0, 10).map((c: any) => (
              <div key={c.id} className="flex items-center px-5 py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.competition_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(c.competition_date).toLocaleDateString('es-ES')}
                    {c.round_type ? ` · ${c.round_type}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${c.total_score === personalBest ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                    {c.total_score}
                  </span>
                  {c.total_score === personalBest && <span className="text-xs ml-1">🏆</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
