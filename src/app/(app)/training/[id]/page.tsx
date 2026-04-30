import { notFound } from 'next/navigation'
import { getPhotos } from '@/lib/actions/photos'
import { PhotoGallery } from '@/components/ui/PhotoGallery'
import { getTrainingSession } from '@/lib/actions/training'
import { deleteTrainingSession } from '@/lib/actions/training'
import { formatDate, feelingEmoji } from '@/lib/utils'
import { WEATHER_LABELS, FEELING_LABELS, MODALITY_LABELS, MODALITY_CONFIG } from '@/types'
import type { Modality } from '@/types'
import { ChevronLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { getTrainingSessions } from '@/lib/actions/training'

function getArrowColor(score: string, modality: Modality): string {
  if (modality === 'campo') {
    if (score === '6' || score === '5') return 'bg-yellow-300 text-yellow-900'
    if (['4', '3', '2', '1'].includes(score)) return 'bg-gray-900 text-white'
    return 'bg-white border border-gray-300 text-gray-500'
  }
  if (modality === '3d') {
    if (score === '11') return 'bg-yellow-400 text-yellow-900 font-bold'
    if (score === '10') return 'bg-yellow-300 text-yellow-900'
    if (score === '8') return 'bg-red-500 text-white'
    if (score === '5') return 'bg-blue-500 text-white'
    return 'bg-white border border-gray-300 text-gray-500'
  }
  if (score === 'X' || score === '10' || score === '9') return 'bg-yellow-300 text-yellow-900 font-bold'
  if (score === '8' || score === '7') return 'bg-red-500 text-white'
  if (score === '6' || score === '5') return 'bg-blue-500 text-white'
  if (score === '4' || score === '3') return 'bg-gray-900 text-white'
  return 'bg-white border border-gray-300 text-gray-500'
}

export default async function TrainingSessionPage({ params }: { params: { id: string } }) {
 const session = await getTrainingSession(params.id)
  if (!session) notFound()

  const [photos, allSessions] = await Promise.all([
    getPhotos(params.id),
    getTrainingSessions(),
  ])

  // Calcular media histórica
  const sessionsWithScore = allSessions.filter((s: any) =>
    s.session_ends && s.session_ends.length > 0 && s.id !== params.id
  )
  const historicalAvg = sessionsWithScore.length > 0
    ? Math.round(
        sessionsWithScore.reduce((sum: number, s: any) =>
          sum + s.session_ends.reduce((a: number, e: any) => a + e.score, 0), 0
        ) / sessionsWithScore.length
      )
    : null

  const ends = session.session_ends ?? []
  const totalScore = ends.reduce((s: number, e: any) => s + e.score, 0)
  const totalArrows = ends.reduce((s: number, e: any) => s + e.arrows, 0)
  const avgPerArrow = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : '—'

  const modality = (session.modality ?? 'sala') as Modality
  const config = MODALITY_CONFIG[modality]

  const totalArrowsForMax = session.total_arrows > 0 ? session.total_arrows : 
    (session.diana_count
      ? session.diana_count * config.arrowsPerEnd
      : config.endsPerSeries * (session.series_count ?? 2) * config.arrowsPerEnd)

  const endsFromArrows = Math.round(totalArrowsForMax / config.arrowsPerEnd)
  const maxScore = endsFromArrows * config.arrowsPerEnd * config.maxScore

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/training/history" className="btn-ghost p-2">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              {formatDate(session.session_date)}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {feelingEmoji(session.feeling_score)} {MODALITY_LABELS[modality]}
            </p>
          </div>
        </div>
        <form action={deleteTrainingSession.bind(null, session.id) as any}>
          <button type="submit" className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalScore}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Puntos</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{maxScore}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Máximo</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{percentage}%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Efectividad</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgPerArrow}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pts/flecha</p>
        </div>
      </div>

{/* Comparativa vs media histórica */}
      {historicalAvg !== null && totalScore > 0 && (
        <div className={`card p-4 flex items-center gap-4 ${
          totalScore >= historicalAvg
            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
            : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
        }`}>
          <span className="text-2xl">{totalScore >= historicalAvg ? '📈' : '📉'}</span>
          <div>
            <p className={`font-semibold ${totalScore >= historicalAvg ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalScore >= historicalAvg ? 'Por encima de tu media' : 'Por debajo de tu media'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Esta sesión: <strong>{totalScore}</strong> · Tu media: <strong>{historicalAvg}</strong> · Diferencia: <strong>{totalScore >= historicalAvg ? '+' : ''}{totalScore - historicalAvg}</strong>
            </p>
          </div>
        </div>
      )}
      {/* Detalles */}
      <div className="card p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Detalles</h2>
        {[
          { label: 'Modalidad', value: MODALITY_LABELS[modality] },
          { label: 'Distancia', value: `${session.distance_meters}m` },
          { label: 'Series', value: session.diana_count ? `${session.diana_count} dianas` : `${session.series_count ?? 2} serie${(session.series_count ?? 2) > 1 ? 's' : ''}` },
          { label: 'Papel de diana', value: session.diana_paper || '—' },
          { label: 'Tiempo / Lugar', value: session.weather ? WEATHER_LABELS[session.weather as keyof typeof WEATHER_LABELS] : '—' },
          { label: 'Objetivo', value: session.objective || '—' },
          { label: 'Notas', value: session.notes || '—' },
        ].filter(item => !(item.label === 'Papel de diana' && modality === '3d')).map(item => (
          <div key={item.label} className="flex gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-32 shrink-0">{item.label}</span>
            <span className="text-sm text-slate-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Tandas con colores */}
      {ends.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tandas</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Media: <strong className="text-slate-900 dark:text-white">{avgPerArrow} pts/flecha</strong>
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ends.map((end: any) => (
              <div key={end.id} className="flex items-center px-5 py-3 gap-3">
                <span className="text-xs text-slate-400 w-6">#{end.end_number}</span>
                <div className="flex gap-1 flex-1">
                  {(end.arrow_scores ?? []).map((s: string, i: number) => (
                    <span
                      key={i}
                      className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center font-bold ${getArrowColor(s, modality)}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <span className="font-semibold text-slate-900 dark:text-white text-sm w-12 text-right">
                  {end.score} pts
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Total · {percentage}% efectividad
            </span>
            <span className="font-bold text-lg text-slate-900 dark:text-white">
              {totalScore} / {maxScore} pts
            </span>
          </div>
        </div>
      )}
	  {/* Fotos */}
      <div className="card p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Fotos</h2>
        <PhotoGallery
          photos={photos}
          sessionId={params.id}
        />
      </div>
    </div>
  )
}