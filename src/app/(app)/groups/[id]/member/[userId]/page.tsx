import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getGroupDetail } from '@/lib/actions/groups'
import { ProgressChart } from '@/components/progress/ProgressChart'
import { ArrowsChart } from '@/components/progress/ArrowsChart'
import { ChevronLeft, Target, Trophy, TrendingUp, Calendar } from 'lucide-react'
import { formatDate, feelingEmoji } from '@/lib/utils'
import { MODALITY_LABELS } from '@/types'
import Link from 'next/link'

export default async function MemberProfilePage({
  params,
}: {
  params: { id: string; userId: string }
}) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const group = await getGroupDetail(params.id)
  if (!group) notFound()

  const members = group.group_members ?? []
  const isMember = members.some((m: any) => m.user_id === user.id)
  if (!isMember) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.userId)
    .single()

  const memberProfile = profile ?? {
    id: params.userId,
    full_name: 'Arquero',
    club_name: null,
    bow_type: null,
    avatar_url: null,
    created_at: '',
    updated_at: '',
  }

  const [sessionsRes, competitionsRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('*, session_ends(*)')
      .eq('user_id', params.userId)
      .order('session_date', { ascending: false })
      .limit(20),
    supabase
      .from('competition_scores')
      .select('*')
      .eq('user_id', params.userId)
      .order('competition_date', { ascending: false }),
  ])

  const sessions = sessionsRes.data ?? []
  const competitions = competitionsRes.data ?? []

  const totalArrows = sessions.reduce((s, sess) => s + (sess.total_arrows ?? 0), 0)
  const personalBest = competitions.length
    ? Math.max(...competitions.map(c => c.total_score))
    : null

  const trainingPoints = sessions
    .filter(s => s.session_ends && s.session_ends.length > 0)
    .map(s => ({
      date: s.session_date,
      score: (s.session_ends as {score:number}[]).reduce((sum, e) => sum + e.score, 0),
      type: 'training' as const,
      label: 'Entrenamiento',
    }))
    .reverse()

  const competitionPoints = competitions.map(c => ({
    date: c.competition_date,
    score: c.total_score,
    type: 'competition' as const,
    label: c.competition_name,
  })).reverse()

  const progressData = [...trainingPoints, ...competitionPoints].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calcular flechas por mes
  const monthMap: Record<string, number> = {}
  for (const s of sessions) {
    const month = s.session_date.slice(0, 7)
    monthMap[month] = (monthMap[month] ?? 0) + (s.total_arrows ?? 0)
  }
  const arrowsByMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({
      month,
      label: new Date(month + '-01').toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      training: total,
      competition: 0,
      total,
    }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/groups/${params.id}`} className="btn-ghost p-2">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            {memberProfile.full_name ?? 'Arquero'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {memberProfile.club_name ?? ''}{memberProfile.bow_type ? ` · ${memberProfile.bow_type}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{sessions.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sesiones</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-2">
            <Target className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{totalArrows.toLocaleString('es-ES')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Flechas</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{personalBest ?? '—'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Mejor marca</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{competitions.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Competiciones</p>
        </div>
      </div>

      {progressData.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Progreso</h2>
          <ProgressChart data={progressData} />
        </div>
      )}

      {arrowsByMonth.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Flechas por mes</h2>
          <ArrowsChart data={arrowsByMonth} />
        </div>
      )}

      {sessions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Últimas sesiones</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.slice(0, 10).map((s: any) => {
              const totalScore = (s.session_ends ?? []).reduce((sum: number, e: any) => sum + e.score, 0)
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="text-xl">{feelingEmoji(s.feeling_score)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(s.session_date)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {s.total_arrows} flechas
                      {s.modality ? ` · ${MODALITY_LABELS[s.modality as keyof typeof MODALITY_LABELS]}` : ''}
                      {s.distance_meters > 0 ? ` · ${s.distance_meters}m` : ''}
                    </p>
                  </div>
                  {totalScore > 0 && (
                    <p className="font-bold text-slate-900 dark:text-white">{totalScore}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {competitions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Competiciones</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {competitions.map((c: any) => (
              <div key={c.id} className="flex items-center px-5 py-3 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.competition_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(c.competition_date)}</p>
                </div>
                <p className={`font-bold text-lg ${c.total_score === personalBest ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {c.total_score}{c.total_score === personalBest ? ' 🏆' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
