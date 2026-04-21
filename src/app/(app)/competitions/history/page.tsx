import { getCompetitionScores } from '@/lib/actions/competitions'
import { deleteCompetitionScore } from '@/lib/actions/competitions'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { PlusCircle, Trophy, Medal } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Competiciones' }

export default async function CompetitionsHistoryPage() {
  const scores = await getCompetitionScores()
  const best = scores.length ? Math.max(...scores.map((s: any) => s.total_score)) : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Competiciones</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {scores.length} resultado{scores.length !== 1 ? 's' : ''}
            {best ? ` · Mejor: ${best} pts` : ''}
          </p>
        </div>
        <Link href="/competitions/new" className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Añadir
        </Link>
      </div>

      {scores.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 mb-4">Todavía no hay resultados de competición.</p>
          <Link href="/competitions/new" className="btn-primary">Añadir primer resultado</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((s: any) => (
            <Link
              key={s.id}
              href={`/competitions/${s.id}`}
              className="card flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                {s.total_score === best
                  ? <Medal className="w-5 h-5 text-amber-500" />
                  : <Trophy className="w-5 h-5 text-amber-400" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{s.competition_name}</p>
                  {s.total_score === best && <span className="badge-amber">🏆 Mejor marca</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(s.competition_date)}
                  {s.category ? ` · ${s.category}` : ''}
                  {s.competition_type ? ` · ${s.competition_type}` : ''}
                  {s.modality ? ` · ${s.modality}` : ''}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.total_score}</p>
                {(s.x_count > 0 || s.tens_count > 0) && (
                  <p className="text-xs text-slate-400">
                    {s.x_count > 0 ? `${s.x_count}X` : ''}{s.x_count > 0 && s.tens_count > 0 ? ' · ' : ''}{s.tens_count > 0 ? `${s.tens_count} dieces` : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
