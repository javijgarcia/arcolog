import { notFound } from 'next/navigation'
import { getTrainingSession } from '@/lib/actions/training'
import { deleteTrainingSession } from '@/lib/actions/training'
import { formatDate, feelingEmoji } from '@/lib/utils'
import { TARGET_TYPE_LABELS, WEATHER_LABELS, FEELING_LABELS } from '@/types'
import { ChevronLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return { title: 'Detalle de sesión' }
}

export default async function TrainingSessionPage({ params }: { params: { id: string } }) {
  const session = await getTrainingSession(params.id)
  if (!session) notFound()

  const ends = session.session_ends ?? []
  const totalScore = ends.reduce((s: number, e: any) => s + e.score, 0)
  const avgPerEnd = ends.length ? Math.round(totalScore / ends.length) : 0

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
              {feelingEmoji(session.feeling_score)} {session.feeling_score ? FEELING_LABELS[session.feeling_score] : ''}
            </p>
          </div>
        </div>
        <form action={deleteTrainingSession.bind(null, session.id)}>
          <button type="submit" className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{session.total_arrows}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Flechas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{session.distance_meters}m</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distancia</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalScore > 0 ? totalScore : '—'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Puntos totales</p>
        </div>
      </div>

      {/* Details */}
      <div className="card p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Detalles</h2>
        {[
          { label: 'Tipo de diana', value: session.target_type ? TARGET_TYPE_LABELS[session.target_type] : '—' },
          { label: 'Tiempo / Lugar', value: session.weather ? WEATHER_LABELS[session.weather] : '—' },
          { label: 'Objetivo', value: session.objective || '—' },
          { label: 'Notas', value: session.notes || '—' },
        ].map(item => (
          <div key={item.label} className="flex gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400 w-32 shrink-0">{item.label}</span>
            <span className="text-sm text-slate-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Ends table */}
      {ends.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tandas</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Promedio: <strong className="text-slate-900 dark:text-white">{avgPerEnd} pts/tanda</strong>
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ends.map((end: any) => (
              <div key={end.id} className="flex items-center px-5 py-3 gap-4">
                <span className="text-sm font-medium text-slate-400 w-8">#{end.end_number}</span>
                <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">{end.arrows} flechas</span>
                <span className="font-semibold text-slate-900 dark:text-white">{end.score} pts</span>
                <span className="text-xs text-slate-400">({Math.round(end.score / end.arrows * 10) / 10}/flecha)</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total</span>
            <span className="font-bold text-lg text-slate-900 dark:text-white">{totalScore} pts</span>
          </div>
        </div>
      )}
    </div>
  )
}
