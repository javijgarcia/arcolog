import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getGroupDetail } from '@/lib/actions/groups'
import { formatDate } from '@/lib/utils'
import { MODALITY_LABELS, COMPETITION_TYPE_LABELS } from '@/types'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function MemberCompetitionPage({
  params,
}: {
  params: { id: string; userId: string; competitionId: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const group = await getGroupDetail(params.id)
  if (!group) notFound()

  const members = group.group_members ?? []
  const isMember = members.some((m: any) => m.user_id === user.id)
  if (!isMember) notFound()

  const { data: competition } = await supabase
    .from('competition_scores')
    .select('*')
    .eq('id', params.competitionId)
    .eq('user_id', params.userId)
    .single()

  if (!competition) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/groups/${params.id}/member/${params.userId}`} className="btn-ghost p-2">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            {competition.competition_name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formatDate(competition.competition_date)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{competition.total_score}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Puntuación</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{competition.x_count ?? 0}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {competition.modality === '3d' ? '11s' : competition.modality === 'campo' ? '6s' : 'X'}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {competition.ranking_position ? `#${competition.ranking_position}` : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Posición</p>
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Detalles</h2>
        {[
          { label: 'Modalidad', value: competition.modality ? MODALITY_LABELS[competition.modality as keyof typeof MODALITY_LABELS] : '—' },
          { label: 'Tipo', value: competition.competition_type ? COMPETITION_TYPE_LABELS[competition.competition_type as keyof typeof COMPETITION_TYPE_LABELS] : '—' },
          { label: 'Categoría', value: competition.category || '—' },
          { label: 'Ronda', value: competition.round_type || '—' },
          { label: 'Distancia', value: competition.distance_meters ? `${competition.distance_meters}m` : '—' },
          { label: 'Notas', value: competition.notes || '—' },
        ].map(item => (
          <div key={item.label} className="flex gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-28 shrink-0">{item.label}</span>
            <span className="text-sm text-slate-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}