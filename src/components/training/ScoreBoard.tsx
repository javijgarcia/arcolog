'use client'

import { useState } from 'react'
import { SCORES_BY_MODALITY, MODALITY_CONFIG } from '@/types'
import type { Modality, SessionEndForm } from '@/types'
import { cn } from '@/lib/utils'

const SCORE_COLORS: Record<string, string> = {
  'X':  'bg-yellow-300 text-yellow-900 font-bold',
  '10': 'bg-yellow-300 text-yellow-900 font-bold',
  '9':  'bg-yellow-300 text-yellow-900',
  '8':  'bg-red-500 text-white font-bold',
  '7':  'bg-red-500 text-white',
  '6':  'bg-blue-500 text-white font-bold',
  '5':  'bg-blue-500 text-white',
  '4':  'bg-gray-900 text-white font-bold',
  '3':  'bg-gray-900 text-white',
  '2':  'bg-white text-gray-900 border border-gray-300',
  '1':  'bg-white text-gray-900 border border-gray-300',
  'M':  'bg-white text-gray-500 border border-gray-300',
  '11': 'bg-yellow-400 text-yellow-900 font-bold',
  '0':  'bg-white text-gray-500 border border-gray-300',
}

function getScoreColor(score: string, modality: Modality): string {
  if (modality === 'campo') {
    if (score === '6' || score === '5') return 'bg-yellow-300 text-yellow-900 font-bold'
    if (['4', '3', '2', '1'].includes(score)) return 'bg-gray-900 text-white'
    if (score === 'M') return 'bg-white text-gray-500 border border-gray-300'
  }
  return SCORE_COLORS[score] ?? 'bg-gray-100 text-gray-700'
}

function scoreToNumber(score: string): number {
  if (score === 'X') return 10
  if (score === 'M') return 0
  return parseInt(score) || 0
}

interface Props {
  modality: Modality
  endNumber: number
  onEndComplete: (end: SessionEndForm) => void
}

export function ScoreBoard({ modality, endNumber, onEndComplete }: Props) {
  const config = MODALITY_CONFIG[modality]
  const scores = SCORES_BY_MODALITY[modality]
  const [arrowScores, setArrowScores] = useState<string[]>([])
  const totalArrows = config.arrowsPerEnd

  function addScore(score: string) {
    if (arrowScores.length >= totalArrows) return
    const newScores = [...arrowScores, score]
    setArrowScores(newScores)

    if (newScores.length === totalArrows) {
      const total = newScores.reduce((sum, s) => sum + scoreToNumber(s), 0)
      onEndComplete({
        end_number: endNumber,
        arrows: totalArrows,
        score: total,
        arrow_scores: newScores,
      })
      setArrowScores([])
    }
  }

  function removeLastScore() {
    setArrowScores(prev => prev.slice(0, -1))
  }

  const currentTotal = arrowScores.reduce((sum, s) => sum + scoreToNumber(s), 0)
  const remaining = totalArrows - arrowScores.length

  return (
    <div className="space-y-4">
      {/* Tanda actual */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Tanda #{endNumber} — {remaining} {remaining === 1 ? 'flecha' : 'flechas'} restantes
        </span>
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          {currentTotal} pts
        </span>
      </div>

      {/* Flechas marcadas */}
      <div className="flex gap-2 min-h-10">
        {Array.from({ length: totalArrows }).map((_, i) => {
          const score = arrowScores[i]
          return (
            <div
              key={i}
              className={cn(
                'flex-1 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all',
                score
                  ? getScoreColor(score, modality)
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600'
              )}
            >
              {score ?? '·'}
            </div>
          )
        })}
      </div>

      {/* Tablilla de puntuación */}
      <div className="grid grid-cols-6 gap-1.5">
        {scores.map(score => (
          <button
            key={score}
            type="button"
            onClick={() => addScore(score)}
            disabled={arrowScores.length >= totalArrows}
            className={cn(
              'h-12 rounded-xl text-sm font-bold transition-all active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              getScoreColor(score, modality)
            )}
          >
            {score}
          </button>
        ))}
      </div>

      {/* Borrar última */}
      {arrowScores.length > 0 && (
        <button
          type="button"
          onClick={removeLastScore}
          className="btn-secondary w-full justify-center text-sm"
        >
          ← Borrar última flecha
        </button>
      )}
    </div>
  )
}