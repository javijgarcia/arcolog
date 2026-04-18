import { getTrainingSessions } from '@/lib/actions/training'
import { formatDate, feelingEmoji } from '@/lib/utils'
import { MODALITY_LABELS } from '@/types'
import Link from 'next/link'
import { PlusCircle, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Historial de entrenos' }

export default async function TrainingHistoryPage() {
  const sessions = await getTrainingSessions()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Historial de entrenos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{sessions.length} sesiones registradas</p>
        </div>
        <Link href="/training/new" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Nuevo
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Todavía no hay sesiones registradas.</p>
          <Link href="/training/new" className="btn-primary">Registrar primer entreno</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s: any) => {
            const sessionEnds = s.session_ends ?? []
            const totalScore = sessionEnds.reduce((sum: number, e: any) => sum + e.score, 0)

            return (
              <Link
                key={s.id}
                href={`/training/${s.id}`}
                className="card flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow group"
              >
                <div className="text-2xl">{feelingEmoji(s.feeling_score)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-slate-900 dark:text-white">{formatDate(s.session_date)}</p>
                   {s.modality && (
  <span className="badge-blue text-xs">{MODALITY_LABELS[s.modality as keyof typeof MODALITY_LABELS]}</span>
)}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {s.total_arrows} flechas · {s.distance_meters}m
                    {s.objective ? ` · ${s.objective}` : ''}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {totalScore > 0 && (
                    <p className="font-bold text-lg text-slate-900 dark:text-white">{totalScore}</p>
                  )}
                  <p className="text-xs text-slate-400">{sessionEnds.length} tandas</p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
