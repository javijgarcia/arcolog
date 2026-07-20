import { notFound } from 'next/navigation'
import { getGroupDetail, getMemberStats, leaveGroup, deleteGroup } from '@/lib/actions/groups'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Users, Copy, Trash2, LogOut, TrendingUp, Target, Trophy } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CopyButton } from './CopyButton'
import { getScheduledTrainings } from '@/lib/actions/scheduled'
import { ScheduleForm } from './ScheduleForm'
import { MODALITY_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'
import { Trash2 as TrashIcon } from 'lucide-react'
import { LeaveGroupButton, RemoveMemberButton, PromoteMemberButton, DemoteMemberButton, DeleteScheduledButton } from './GroupActions'
import { getGroupActivity } from '@/lib/actions/groups'
import { GroupCalendar } from './GroupCalendar'
import { GroupRanking } from './GroupRanking'
import { GroupComparison } from './GroupComparison'
import { ExportButton } from '@/components/ui/ExportButton'

export const metadata: Metadata = { title: 'Grupo' }

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const group = await getGroupDetail(params.id)
  if (!group) notFound()

const isOwner = group.owner_id === user.id
  const members = group.group_members ?? []
 const [scheduledTrainings, groupActivity] = await Promise.all([
    getScheduledTrainings(params.id),
    getGroupActivity(params.id),
  ])

  // Obtener stats de cada miembro
  const memberStats = await Promise.all(
    members.map(async (m: any) => ({
      member: m,
      stats: await getMemberStats(m.user_id),
    }))
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{group.description}</p>
          )}
        </div>
        <div className="flex gap-2">
   {!isOwner && (
            <LeaveGroupButton groupId={group.id} />
          )}
          {!isOwner && (
            <LeaveGroupButton groupId={group.id} />
          )}
        </div>
      </div>
	  
	  {/* Exportar datos del grupo */}
      {isOwner && (
        <div className="flex justify-end">
          <ExportButton type="group" groupId={group.id} label="Exportar grupo" />
        </div>
      )}

      {/* Código de invitación (solo entrenador) */}
      {isOwner && (
        <div className="card p-5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Código de invitación</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-center text-2xl font-mono font-bold tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 rounded-xl py-3">
              {group.invite_code}
            </code>
          <CopyButton code={group.invite_code} />
          </div>
          <p className="text-xs text-slate-400 mt-2">Comparte este código con tus arqueros para que se unan al grupo</p>
        </div>
      )}

      {/* Miembros */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Miembros ({members.length})
        </h2>

        {memberStats.map(({ member, stats }) => (
          <div key={member.id} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {member.profiles?.full_name ?? 'Arquero'}
                  {member.user_id === user.id && <span className="text-xs text-slate-400 ml-2">(tú)</span>}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {member.role === 'entrenador' ? '🧑‍🏫 Entrenador' : '🏹 Arquero'}
                  {stats.lastSession && ` · Último entreno: ${new Date(stats.lastSession).toLocaleDateString('es-ES')}`}
                </p>
              </div>
             {member.user_id !== user.id && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/groups/${params.id}/member/${member.user_id}`}
                    className="btn-secondary text-xs py-1.5"
                  >
                    Ver perfil
                  </Link>
                  {isOwner && (
                    <>
                      {member.role === 'arquero' ? (
                        <PromoteMemberButton
                          groupId={group.id}
                          userId={member.user_id}
                          memberName={member.profiles?.full_name ?? 'este arquero'}
                        />
                      ) : (
                        <DemoteMemberButton
                          groupId={group.id}
                          userId={member.user_id}
                          memberName={member.profiles?.full_name ?? 'este entrenador'}
                        />
                      )}
                      <RemoveMemberButton
                        groupId={group.id}
                        userId={member.user_id}
                        memberName={member.profiles?.full_name ?? 'este arquero'}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Stats del miembro */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Target className="w-3.5 h-3.5 text-brand-500" />
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalArrows.toLocaleString('es-ES')}</p>
                <p className="text-xs text-slate-400">Flechas</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.totalSessions}</p>
                <p className="text-xs text-slate-400">Sesiones</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.personalBest ?? '—'}</p>
                <p className="text-xs text-slate-400">Mejor marca</p>
              </div>
            </div>

            {/* Últimas puntuaciones */}
            {stats.recentScores.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Últimas sesiones</p>
                <div className="flex gap-1.5">
                  {stats.recentScores.map((s, i) => (
                    <div key={i} className="flex-1 bg-brand-50 dark:bg-brand-900/20 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-brand-700 dark:text-brand-300">{s.score}</p>
                      <p className="text-xs text-slate-400">{new Date(s.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
	  
	  {/* Crear eliminatoria */}
      {isOwner && (
        <div className="flex justify-end">
          <Link
            href={`/eliminations/new?group_id=${group.id}`}
            className="btn-secondary flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Crear eliminatoria
          </Link>
        </div>
      )}
	  
	  {/* Entrenamientos programados */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
		{/* Calendario del grupo */}
      <div className="card p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Calendario del grupo</h2>
        <GroupCalendar
          scheduled={groupActivity.scheduled}
          activity={groupActivity.activity}
        />
      </div>
	  {/* Ranking del grupo */}
      <div className="card p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">🏆 Ranking del grupo</h2>
        <GroupRanking groupId={group.id} />
      </div>
	  {/* Comparativa entre miembros */}
      <div className="card p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">📊 Comparativa de progreso</h2>
        <GroupComparison groupId={group.id} />
      </div>
          Entrenamientos programados
        </h2>

        {isOwner && <ScheduleForm groupId={group.id} />}

        {scheduledTrainings.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
            No hay entrenamientos programados
          </p>
        ) : (
          <div className="space-y-2">
            {scheduledTrainings.map((t: any) => {
              const completions = t.scheduled_training_completions ?? []
              const completed = completions.filter((c: any) => c.status === 'completado').length
              const pending = completions.filter((c: any) => c.status === 'pendiente').length
              const discarded = completions.filter((c: any) => c.status === 'descartado').length

              return (
                <div key={t.id} className="card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {formatDate(t.scheduled_date)}
                        </p>
                        {t.modality && (
                          <span className="badge-blue text-xs">
                            {MODALITY_LABELS[t.modality as keyof typeof MODALITY_LABELS]}
                          </span>
                        )}
                      </div>
                      {t.objective && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.objective}</p>
                      )}
                      {t.notes && (
                        <p className="text-xs text-slate-400 mt-1">{t.notes}</p>
                      )}
                    </div>
                    {isOwner && (
                      <DeleteScheduledButton trainingId={t.id} groupId={group.id} />
                    )}
                  </div>

                  {completions.length > 0 && (
                    <div className="flex gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-green-600 dark:text-green-400">✅ {completed} completados</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400">⏳ {pending} pendientes</span>
                      {discarded > 0 && <span className="text-xs text-slate-400">❌ {discarded} descartados</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}