import { getBracketByToken } from '@/lib/actions/eliminations'
import { notFound } from 'next/navigation'
import { MODALITY_LABELS } from '@/types'
import { Trophy } from 'lucide-react'

export default async function PublicBracketPage({ params }: { params: { token: string } }) {
  const bracket = await getBracketByToken(params.token)
  if (!bracket) notFound()

  const rounds = Math.log2(bracket.participant_count)
  const roundNames: Record<number, string> = {
    1: bracket.participant_count === 4 ? 'Semifinales' :
       bracket.participant_count === 8 ? 'Cuartos de final' :
       bracket.participant_count === 16 ? 'Octavos de final' : 'Dieciseisavos',
    2: bracket.participant_count === 8 ? 'Semifinales' :
       bracket.participant_count === 16 ? 'Cuartos de final' : 'Octavos de final',
    3: bracket.participant_count === 16 ? 'Semifinales' : 'Cuartos de final',
    4: 'Semifinales',
    5: 'Final',
  }
  roundNames[rounds] = 'Final'

  const matches = (bracket.elimination_matches ?? []) as any[]

  function getMatchesForRound(round: number) {
    return matches
      .filter((m: any) => m.round === round)
      .sort((a: any, b: any) => a.position - b.position)
  }

  function getSetScore(match: any) {
    const sets = (match.elimination_sets ?? []).filter((s: any) => !s.is_shootoff)
    const score1 = sets.reduce((sum: number, s: any) => sum + (s.points1 ?? 0), 0)
    const score2 = sets.reduce((sum: number, s: any) => sum + (s.points2 ?? 0), 0)
    return { score1, score2 }
  }

  const scoreColors: Record<string, string> = {
    'X': 'bg-yellow-300 text-yellow-900',
    '11': 'bg-yellow-300 text-yellow-900',
    '10': 'bg-yellow-300 text-yellow-900',
    '9': 'bg-yellow-300 text-yellow-900',
    '8': 'bg-red-500 text-white',
    '7': 'bg-red-500 text-white',
    '6': 'bg-blue-500 text-white',
    '5': 'bg-blue-500 text-white',
    '4': 'bg-gray-900 text-white',
    '3': 'bg-gray-900 text-white',
    '2': 'bg-white border border-gray-300 text-gray-700',
    '1': 'bg-white border border-gray-300 text-gray-700',
    'M': 'bg-slate-200 text-slate-600',
    '0': 'bg-slate-200 text-slate-600',
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="ArcoLog" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-slate-600 dark:text-slate-400">ArcoLog</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{bracket.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {MODALITY_LABELS[bracket.modality as keyof typeof MODALITY_LABELS]} ·{' '}
            {bracket.participant_count} arqueros ·{' '}
            {bracket.arrows_per_set} flechas/entrada
          </p>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            bracket.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : bracket.status === 'active' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              bracket.status === 'active' ? 'bg-brand-500 animate-pulse' : 'bg-current'
            }`} />
            {bracket.status === 'completed' ? 'Finalizado' : bracket.status === 'active' ? 'En directo' : 'Pendiente'}
          </span>
        </div>

        {/* Rondas */}
        {Array.from({ length: rounds }, (_, i) => i + 1).map(round => (
          <div key={round} className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              {roundNames[round] ?? `Ronda ${round}`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getMatchesForRound(round).map((match: any) => {
                const { score1, score2 } = getSetScore(match)
                const sets = match.elimination_sets ?? []

                return (
                  <div key={match.id} className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 space-y-3 shadow-sm ${
                    match.status === 'completed' ? 'border-green-200 dark:border-green-800'
                    : match.status === 'active' ? 'border-brand-300 dark:border-brand-700'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}>
                    {[
                      { participant: match.participant1, score: score1, isWinner: match.winner_id === match.participant1_id },
                      { participant: match.participant2, score: score2, isWinner: match.winner_id === match.participant2_id },
                    ].map(({ participant, score, isWinner }, idx) => (
                      <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                        isWinner ? 'bg-green-50 dark:bg-green-900/20' : ''
                      }`}>
                        <span className={`text-sm font-medium flex-1 ${
                          isWinner ? 'text-green-700 dark:text-green-300 font-semibold' : 'text-slate-900 dark:text-white'
                        }`}>
                          {isWinner && '🏆 '}
                          {participant?.display_name ?? (match.status === 'pending' ? 'Por determinar' : '—')}
                        </span>
                        <span className={`text-xl font-bold w-8 text-center ${
                          isWinner ? 'text-green-700 dark:text-green-300' : 'text-slate-900 dark:text-white'
                        }`}>
                          {match.status === 'pending' ? '' : score}
                        </span>
                      </div>
                    ))}

                    {sets.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {sets.map((s: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 w-16 shrink-0">
                              {s.is_shootoff ? 'Shoot-off' : `Set ${s.set_number}`}
                            </span>
                            <div className="flex gap-0.5 flex-1">
                              {(s.arrow_scores1 ?? []).map((a: string, j: number) => (
                                <span key={j} className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${scoreColors[a] ?? 'bg-slate-100'}`}>{a}</span>
                              ))}
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 w-5 text-center">{s.total1}</span>
                            <span className="text-slate-300">|</span>
                            <div className="flex gap-0.5 flex-1">
                              {(s.arrow_scores2 ?? []).map((a: string, j: number) => (
                                <span key={j} className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${scoreColors[a] ?? 'bg-slate-100'}`}>{a}</span>
                              ))}
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 w-5 text-center">{s.total2}</span>
                            <span className={`w-8 text-center font-bold text-xs ${s.points1 > s.points2 ? 'text-green-600' : s.points2 > s.points1 ? 'text-red-500' : 'text-slate-400'}`}>
                              {s.is_shootoff ? '' : `${s.points1}-${s.points2}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400">
            Powered by <a href="https://arcolog.vercel.app" className="text-brand-500 hover:underline">ArcoLog</a>
          </p>
        </div>
      </div>
    </div>
  )
}