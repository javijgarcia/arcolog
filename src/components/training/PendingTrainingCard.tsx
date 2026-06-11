'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCompletionStatus } from '@/lib/actions/scheduled'
import { MODALITY_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'
import { Calendar, Check, X, Trophy } from 'lucide-react'

export function PendingTrainingCard({ completion }: { completion: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const training = completion.scheduled_trainings
  const isCompetition = training.event_type === 'competicion'

  async function handleDiscard() {
    if (!confirm('Marcar como no realizado?')) return
    setLoading(true)
    await updateCompletionStatus(completion.id, 'descartado')
    router.refresh()
    setLoading(false)
  }

  const isPast = new Date(training.scheduled_date) < new Date()

  return (
    <div className={`card p-4 flex items-center gap-4 ${isPast ? 'border-amber-200 dark:border-amber-800' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCompetition ? 'bg-amber-50 dark:bg-amber-900/20' : isPast ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-brand-50 dark:bg-brand-900/20'}`}>
        {isCompetition
          ? <Trophy className="w-5 h-5 text-amber-500" />
          : <Calendar className={`w-5 h-5 ${isPast ? 'text-amber-500' : 'text-brand-500'}`} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white text-sm">
          {isCompetition ? training.competition_name ?? 'Competicion' : formatDate(training.scheduled_date)}
          {isPast && <span className="text-amber-500 text-xs ml-2">Pendiente</span>}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isCompetition ? formatDate(training.scheduled_date) : ''}
          {training.modality ? ` - ${MODALITY_LABELS[training.modality as keyof typeof MODALITY_LABELS]}` : ''}
          {training.distance_meters ? ` - ${training.distance_meters}m` : ''}
          {training.objective && !isCompetition ? ` - ${training.objective}` : ''}
        </p>
      </div>

      <div className="flex gap-2 shrink-0">
        <a
          href={isCompetition
            ? `/competitions/new?scheduled=${completion.id}&modality=${training.modality ?? ''}`
            : `/training/new?scheduled=${completion.id}&modality=${training.modality ?? ''}&distance=${training.distance_meters ?? ''}&objective=${encodeURIComponent(training.objective ?? '')}`
          }
          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
        >
          <Check className="w-3 h-3" />
          Registrar
        </a>
        {isPast && (
          <button
            type="button"
            onClick={handleDiscard}
            disabled={loading}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
