import { getDashboardStats, getProfile } from '@/lib/actions/profile'
import { getTrainingSessions } from '@/lib/actions/training'
import { Target, Flame, Trophy, TrendingUp, Calendar, ArrowRight, Zap } from 'lucide-react'
import { formatDate, feelingEmoji } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'
import { TrainingHeatmap } from '@/components/progress/TrainingHeatmap'
import { getMyPendingTrainings, getMyUpcomingTrainings } from '@/lib/actions/scheduled'
import { PendingTrainingCard } from '@/components/training/PendingTrainingCard'
import { getInactiveMembers } from '@/lib/actions/groups'

export const metadata: Metadata = { title: 'Inicio' }

export default async function DashboardPage() {
 const [stats, profile, allSessions, pendingTrainings, upcomingTrainings, inactiveMembers] = await Promise.all([
    getDashboardStats(),
    getProfile(),
    getTrainingSessions(),
    getMyPendingTrainings(),
    getMyUpcomingTrainings(),
    getInactiveMembers(),
  ])
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Arquero'

  const arrowsTrend = stats?.arrowsDiff ?? 0
  const scoreTrend = stats?.scoreDiff ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Hola, {firstName} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {(stats?.streak ?? 0) > 0 && (
          <div className="card px-4 py-3 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{stats?.streak}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">días seguidos</p>
            </div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-brand-500" />}
          label="Sesiones"
          value={stats?.totalSessions ?? 0}
          bg="bg-brand-50 dark:bg-brand-900/20"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-orange-500" />}
          label="Flechas tiradas"
          value={(stats?.totalArrows ?? 0).toLocaleString('es-ES')}
          bg="bg-orange-50 dark:bg-orange-900/20"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-amber-500" />}
          label="Competiciones"
          value={stats?.totalCompetitions ?? 0}
          bg="bg-amber-50 dark:bg-amber-900/20"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          label="Mejor marca"
          value={stats?.personalBest ?? '—'}
          bg="bg-green-50 dark:bg-green-900/20"
        />
      </div>

      {/* Esta semana vs semana anterior */}
      {stats && (stats.thisWeek.sessions > 0 || stats.lastWeek.sessions > 0) && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            Esta semana vs semana anterior
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <WeekCompare
              label="Sesiones"
              current={stats.thisWeek.sessions}
              previous={stats.lastWeek.sessions}
            />
            <WeekCompare
              label="Flechas"
              current={stats.thisWeek.arrows}
              previous={stats.lastWeek.arrows}
            />
            <WeekCompare
              label="Puntuación"
              current={stats.thisWeek.score}
              previous={stats.lastWeek.score}
            />
          </div>
          {stats.bestWeekArrows > 0 && (
            <p className="text-xs text-slate-400 mt-3 text-right">
              🏆 Mejor semana histórica: <strong className="text-slate-600 dark:text-slate-300">{stats.bestWeekArrows} flechas</strong>
            </p>
          )}
        </div>
      )}
	  {/* Entrenamientos pendientes */}
      {pendingTrainings.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
            ⚠️ Entrenamientos pendientes
          </h2>
          <div className="space-y-2">
            {pendingTrainings.map((c: any) => (
              <PendingTrainingCard key={c.id} completion={c} />
            ))}
          </div>
        </section>
      )}

      {/* Próximos entrenamientos */}
      {upcomingTrainings.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
            📅 Próximos entrenamientos
          </h2>
          <div className="space-y-2">
            {upcomingTrainings.map((c: any) => (
              <PendingTrainingCard key={c.id} completion={c} />
            ))}
          </div>
        </section>
      )}

{/* Arqueros inactivos esta semana */}
      {inactiveMembers.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
            ⚠️ Sin entrenar esta semana
          </h2>
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {inactiveMembers.map((m: any) => (
              <Link
                key={`${m.group_id}-${m.user_id}`}
                href={`/groups/${m.group_id}/member/${m.user_id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <span className="text-sm">🏹</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{m.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.group_name}</p>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400">Sin entreno</span>
              </Link>
            ))}
          </div>
        </section>
      )}
	  
      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/training/new" className="card p-5 hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white">Registrar entreno</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Nueva sesión de hoy</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
        </Link>
        <Link href="/competitions/new" className="card p-5 hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white">Registrar competición</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Añadir resultado</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
        </Link>
      </div>

      {/* Últimas sesiones */}
	  {stats && stats.totalSessions > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Actividad del año</h2>
          <div className="card p-5">
           <TrainingHeatmap sessions={allSessions} />
          </div>
        </section>
      )}
      {stats && stats.recentSessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Últimas sesiones</h2>
            <Link href="/training/history" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
              Ver todo
            </Link>
          </div>
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recentSessions.map((s: any) => (
              <Link key={s.id} href={`/training/${s.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="text-xl">{feelingEmoji(s.feeling_score)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(s.session_date)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.total_arrows} flechas · {s.distance_meters > 0 ? `${s.distance_meters}m` : 'recorrido'}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {stats && stats.totalSessions === 0 && (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-brand-500" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¡Bienvenido a ArcoLog!</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
            Registra tu primera sesión de entrenamiento para empezar a ver tu progreso.
          </p>
          <Link href="/training/new" className="btn-primary">
            Registrar primer entreno
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, bg }: {
  icon: React.ReactNode
  label: string
  value: string | number
  bg: string
}) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

function WeekCompare({ label, current, previous }: {
  label: string
  current: number
  previous: number
}) {
  const diff = current - previous
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : null

  return (
    <div className="text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white">{current}</p>
      <p className="text-xs mt-0.5">
        {diff === 0 ? (
          <span className="text-slate-400">igual</span>
        ) : diff > 0 ? (
          <span className="text-green-600 dark:text-green-400">↑ +{diff}{pct !== null ? ` (${pct}%)` : ''}</span>
        ) : (
          <span className="text-red-500">↓ {diff}{pct !== null ? ` (${pct}%)` : ''}</span>
        )}
      </p>
    </div>
  )
}