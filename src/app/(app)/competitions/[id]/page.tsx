import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { deleteCompetitionScore } from '@/lib/actions/competitions'
import { getPhotos } from '@/lib/actions/photos'
import { PhotoGallery } from '@/components/ui/PhotoGallery'
import { formatDate } from '@/lib/utils'
import { MODALITY_LABELS, COMPETITION_TYPE_LABELS } from '@/types'
import { ChevronLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { EditCompetitionForm } from './EditCompetitionForm'
import { DeleteCompetitionButton } from './DeleteCompetitionButton'

export default async function CompetitionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

 const { data: competition } = await supabase
    .from('competition_scores')
    .select('*, competition_ends(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!competition) notFound()
	  
  const photos = await getPhotos(undefined, params.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
	
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/competitions/history" className="btn-ghost p-2">
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
       <div className="flex gap-2">
          <EditCompetitionForm competition={competition} />
         <DeleteCompetitionButton competitionId={competition.id} />
        </div>
      </div>

      {/* Stats */}
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

      {/* Detalles */}
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
	  
	  {/* Tandas de competición */}
      {competition.competition_ends && competition.competition_ends.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tandas</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {competition.competition_ends.length} tandas
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {competition.competition_ends
              .sort((a: any, b: any) => a.end_number - b.end_number)
              .map((end: any) => (
              <div key={end.id} className="flex items-center px-5 py-3 gap-3">
                <span className="text-xs text-slate-400 w-6">#{end.end_number}</span>
                <div className="flex gap-1 flex-1">
                  {(end.arrow_scores ?? []).map((s: string, i: number) => (
                    <span key={i} className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center font-bold ${
                      s === 'X' || s === '10' || s === '9' ? 'bg-yellow-300 text-yellow-900'
                      : s === '8' || s === '7' ? 'bg-red-500 text-white'
                      : s === '6' || s === '5' ? 'bg-blue-500 text-white'
                      : s === '4' || s === '3' ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-300 text-gray-500'
                    }`}>{s}</span>
                  ))}
                </div>
                <span className="font-semibold text-slate-900 dark:text-white text-sm w-12 text-right">
                  {end.score} pts
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total</span>
            <span className="font-bold text-lg text-slate-900 dark:text-white">{competition.total_score} pts</span>
          </div>
        </div>
      )}

      {/* Fotos */}
      <div className="card p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Fotos</h2>
        <PhotoGallery
          photos={photos}
          competitionId={params.id}
        />
      </div>
    </div>
  )
}