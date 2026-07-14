'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitSet } from '@/lib/actions/eliminations'
import type { EliminationBracket, EliminationMatch, EliminationSet } from '@/types'
import { ScoreBoard } from '@/components/training/ScoreBoard'
import type { Modality, SessionEndForm } from '@/types'

interface Props {
  bracket: EliminationBracket & {
    elimination_matches: (EliminationMatch & {
      elimination_sets: EliminationSet[]
      participant1: any
      participant2: any
      winner: any
    })[]
    elimination_participants: any[]
  }
  roundNames: Record<number, string>
  isOwner: boolean
  currentUserId: string
}

export function BracketView({ bracket, roundNames, isOwner, currentUserId }: Props) {
  const router = useRouter()
  const [activeMatch, setActiveMatch] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentSetArrows1, setCurrentSetArrows1] = useState<string[]>([])
  const [currentSetArrows2, setCurrentSetArrows2] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<1 | 2>(1)

  const matches = bracket.elimination_matches ?? []
  const rounds = Math.log2(bracket.participant_count)

  function getMatchesForRound(round: number) {
    return matches
      .filter(m => m.round === round)
      .sort((a, b) => a.position - b.position)
  }

  function getSetScore(match: any) {
    const sets = match.elimination_sets ?? []
    const regularSets = sets.filter((s: any) => !s.is_shootoff)
    const score1 = regularSets.reduce((sum: number, s: any) => sum + (s.points1 ?? 0), 0)
    const score2 = regularSets.reduce((sum: number, s: any) => sum + (s.points2 ?? 0), 0)
    return { score1, score2 }
  }

  function getNextSetNumber(match: any) {
    const sets = match.elimination_sets ?? []
    return sets.length + 1
  }

  function isShootoff(match: any) {
    const { score1, score2 } = getSetScore(match)
    return score1 === 5 && score2 === 5
  }

  async function handleSubmitSet(match: any) {
    const shootoff = isShootoff(match)
    const arrowsNeeded = shootoff ? 1 : bracket.arrows_per_set
    if (currentSetArrows1.length < arrowsNeeded || currentSetArrows2.length < arrowsNeeded) {
      alert(`Faltan flechas — cada arquero necesita ${arrowsNeeded} ${arrowsNeeded === 1 ? 'flecha' : 'flechas'}`)
      return
    }

    setLoading(true)
    const setNumber = getNextSetNumber(match)

    const result = await submitSet({
      match_id: match.id,
      set_number: setNumber,
      arrow_scores1: currentSetArrows1,
      arrow_scores2: currentSetArrows2,
      is_shootoff: shootoff,
    })

    if (result?.error) {
      alert(result.error)
      setLoading(false)
      return
    }

    setCurrentSetArrows1([])
    setCurrentSetArrows2([])
    setInputMode(1)

    if (result.newStatus === 'completed') {
      setActiveMatch(null)
    }

    router.refresh()
    setLoading(false)
  }

  function addArrow(score: string, shootoff: boolean) {
    const arrowsNeeded = shootoff ? 1 : bracket.arrows_per_set
    if (inputMode === 1 && currentSetArrows1.length < arrowsNeeded) {
      setCurrentSetArrows1(prev => {
        const next = [...prev, score]
        if (next.length === arrowsNeeded) setInputMode(2)
        return next
      })
    } else if (inputMode === 2 && currentSetArrows2.length < arrowsNeeded) {
      setCurrentSetArrows2(prev => [...prev, score])
    }
  }

  function removeLastArrow() {
    if (inputMode === 2 && currentSetArrows2.length > 0) {
      setCurrentSetArrows2(prev => prev.slice(0, -1))
    } else if (inputMode === 1 && currentSetArrows1.length > 0) {
      setCurrentSetArrows1(prev => {
        const next = prev.slice(0, -1)
        return next
      })
    } else if (inputMode === 2 && currentSetArrows2.length === 0) {
      setInputMode(1)
    }
  }

  const SCORES_SALA = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M']
  const SCORES_CAMPO = ['6', '5', '4', '3', '2', '1', 'M']
  const SCORES_3D = ['11', '10', '8', '5', '0', 'M']

  function getScores() {
    if (bracket.modality === 'campo') return SCORES_CAMPO
    if (bracket.modality === '3d') return SCORES_3D
    return SCORES_SALA
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
    <div className="space-y-8">
      {Array.from({ length: rounds }, (_, i) => i + 1).map(round => (
        <div key={round} className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {roundNames[round] ?? `Ronda ${round}`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getMatchesForRound(round).map(match => {
              const { score1, score2 } = getSetScore(match)
              const sets = match.elimination_sets ?? []
              const isActive = activeMatch === match.id
              const shootoff = isShootoff(match)
              const nextSet = getNextSetNumber(match)

              return (
                <div key={match.id} className={`card p-4 space-y-3 ${
                  match.status === 'active' ? 'border-brand-300 dark:border-brand-700'
                  : match.status === 'completed' ? 'border-green-200 dark:border-green-800'
                  : 'opacity-60'
                }`}>
                  {/* Participantes y marcador */}
                  <div className="space-y-2">
                    {[
                      { participant: match.participant1, score: score1, isWinner: match.winner_id === match.participant1_id },
                      { participant: match.participant2, score: score2, isWinner: match.winner_id === match.participant2_id },
                    ].map(({ participant, score, isWinner }, idx) => (
                      <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                        isWinner ? 'bg-green-50 dark:bg-green-900/20' : ''
                      }`}>
                        <span className={`text-sm font-medium flex-1 ${
                          isWinner ? 'text-green-700 dark:text-green-300' : 'text-slate-900 dark:text-white'
                        }`}>
                          {isWinner && '🏆 '}
                          {participant?.display_name ?? '—'}
                        </span>
                        <span className={`text-xl font-bold w-8 text-center ${
                          isWinner ? 'text-green-700 dark:text-green-300' : 'text-slate-900 dark:text-white'
                        }`}>
                          {score}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Sets jugados */}
                  {sets.length > 0 && (
                    <div className="space-y-1.5">
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
                          <span className="font-bold text-slate-700 dark:text-slate-300 w-6 text-center">{s.total1}</span>
                          <span className="text-slate-300">|</span>
                          <div className="flex gap-0.5 flex-1">
                            {(s.arrow_scores2 ?? []).map((a: string, j: number) => (
                              <span key={j} className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${scoreColors[a] ?? 'bg-slate-100'}`}>{a}</span>
                            ))}
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 w-6 text-center">{s.total2}</span>
                          <span className={`w-8 text-center font-bold ${s.points1 > s.points2 ? 'text-green-600' : s.points2 > s.points1 ? 'text-red-500' : 'text-slate-400'}`}>
                            {s.is_shootoff ? (s.points1 > 0 ? '✓' : s.points2 > 0 ? '✗' : '—') : `${s.points1}-${s.points2}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Shoot-off indicator */}
                  {shootoff && match.status === 'active' && !isActive && (
                    <div className="text-center py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">⚡ Shoot-off — 1 flecha cada arquero</p>
                    </div>
                  )}

                  {/* Botón tantear */}
                  {isOwner && match.status === 'active' && !isActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMatch(match.id)
                        setCurrentSetArrows1([])
                        setCurrentSetArrows2([])
                        setInputMode(1)
                      }}
                      className="btn-primary w-full justify-center text-sm"
                    >
                      {shootoff ? '⚡ Tantear shoot-off' : `Tantear set ${nextSet}`}
                    </button>
                  )}

                  {/* Panel de tanteo */}
                  {isActive && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {shootoff ? 'Shoot-off' : `Set ${nextSet}`} — {
                            inputMode === 1
                              ? `Introduciendo flechas de ${match.participant1?.display_name ?? 'Arquero 1'}`
                              : `Introduciendo flechas de ${match.participant2?.display_name ?? 'Arquero 2'}`
                          }
                        </p>

                        {/* Flechas arquero 1 */}
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">{match.participant1?.display_name}</p>
                          <div className="flex gap-1">
                            {Array.from({ length: shootoff ? 1 : bracket.arrows_per_set }).map((_, i) => (
                              <div key={i} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                currentSetArrows1[i]
                                  ? scoreColors[currentSetArrows1[i]] ?? 'bg-slate-200'
                                  : 'bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600'
                              }`}>
                                {currentSetArrows1[i] ?? ''}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Flechas arquero 2 */}
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">{match.participant2?.display_name}</p>
                          <div className="flex gap-1">
                            {Array.from({ length: shootoff ? 1 : bracket.arrows_per_set }).map((_, i) => (
                              <div key={i} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                currentSetArrows2[i]
                                  ? scoreColors[currentSetArrows2[i]] ?? 'bg-slate-200'
                                  : 'bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600'
                              }`}>
                                {currentSetArrows2[i] ?? ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Tablilla de puntuaciones */}
                      <div className="grid grid-cols-6 gap-1.5">
                        {getScores().map(score => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => addArrow(score, shootoff)}
                            disabled={
                              (inputMode === 1 && currentSetArrows1.length >= (shootoff ? 1 : bracket.arrows_per_set)) ||
                              (inputMode === 2 && currentSetArrows2.length >= (shootoff ? 1 : bracket.arrows_per_set))
                            }
                            className={`py-2 rounded-lg text-sm font-bold transition-all ${scoreColors[score] ?? 'bg-slate-200'} disabled:opacity-30`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={removeLastArrow}
                          className="btn-secondary flex-1 justify-center text-sm"
                        >
                          ← Borrar
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMatch(null)}
                          className="btn-secondary flex-1 justify-center text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitSet(match)}
                          disabled={loading || currentSetArrows1.length < (shootoff ? 1 : bracket.arrows_per_set) || currentSetArrows2.length < (shootoff ? 1 : bracket.arrows_per_set)}
                          className="btn-primary flex-1 justify-center text-sm"
                        >
                          {loading ? 'Guardando...' : 'Confirmar set'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
