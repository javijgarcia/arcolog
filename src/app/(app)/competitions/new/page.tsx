'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCompetitionScore } from '@/lib/actions/competitions'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { MODALITY_LABELS, MODALITY_CONFIG, COMPETITION_TYPE_LABELS } from '@/types'
import type { Modality, SessionEndForm } from '@/types'
import { ScoreBoard } from '@/components/training/ScoreBoard'
import { ArcheryTarget } from '@/components/training/ArcheryTarget'

const today = new Date().toISOString().split('T')[0]

export default function NewCompetitionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modality, setModality] = useState<Modality | null>(null)
  const [competitionType, setCompetitionType] = useState<string | null>(null)
  const [seriesCount, setSeriesCount] = useState(2)
  const [dianaCount, setDianaCount] = useState(24)
  const [controlMode, setControlMode] = useState(false)
  const [ends, setEnds] = useState<SessionEndForm[]>([])
  const [dianaMode, setDianaMode] = useState(false)
  
  // Calcular X y 10s automáticamente del modo control
  const autoXCount = ends.flatMap(e => e.arrow_scores).filter(s => s === 'X').length
  const autoTensCount = ends.flatMap(e => e.arrow_scores).filter(s => {
    if (modality === '3d') return s === '11'
    if (modality === 'campo') return s === '6'
    if (modality === 'sala') return s === '9'
    return s === '10'
  }).length

  const config = modality ? MODALITY_CONFIG[modality] : null

  const totalEndsExpected = config
    ? config.hasDianas ? dianaCount : config.endsPerSeries * seriesCount
    : 0

  const maxScore = config
    ? config.hasDianas
      ? dianaCount * config.arrowsPerEnd * config.maxScore
      : config.endsPerSeries * seriesCount * config.arrowsPerEnd * config.maxScore
    : 0

  const totalScore = ends.reduce((s, e) => s + e.score, 0)
  const totalArrows = ends.reduce((s, e) => s + e.arrows, 0)
  const avgPerArrow = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : '—'
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null
  const sessionComplete = controlMode && config !== null && ends.length >= totalEndsExpected
  const currentEndNumber = ends.length + 1

  function handleModalityChange(m: Modality) {
    setModality(m)
    setEnds([])
  }

  function handleEndComplete(end: SessionEndForm) {
    setEnds(prev => [...prev, end])
  }

  function removeLastEnd() {
    setEnds(prev => prev.slice(0, -1))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const totalScoreValue = controlMode && ends.length > 0
      ? totalScore
      : Number(fd.get('total_score'))

    const result = await createCompetitionScore({
      competition_date: fd.get('competition_date') as string,
      competition_name: fd.get('competition_name') as string,
      category: fd.get('category') as string,
      modality,
      competition_type: competitionType as any,
      distance_meters: Number(fd.get('distance_meters') || 0),
      round_type: fd.get('round_type') as string,
      total_score: totalScoreValue,
      x_count: Number(fd.get('x_count') || 0),
      tens_count: Number(fd.get('tens_count') || 0),
      ranking_position: fd.get('ranking_position') ? Number(fd.get('ranking_position')) : null,
      notes: fd.get('notes') as string,
      series_count: seriesCount,
      diana_count: config?.hasDianas ? dianaCount : null,
      use_control: controlMode,
      ends_json: controlMode ? JSON.stringify(ends) : '[]',
      ends: [],
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      router.push('/competitions/history')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/competitions/history" className="btn-ghost p-2">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1>Nueva competición</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Registra tu resultado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Modalidad */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Modalidad</h2>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(MODALITY_LABELS) as [Modality, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleModalityChange(key)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  modality === key
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de competición */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tipo de competición</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(COMPETITION_TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCompetitionType(competitionType === key ? null : key)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  competitionType === key
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Datos del torneo */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Datos del torneo</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha</label>
              <input name="competition_date" type="date" defaultValue={today} required className="input" />
            </div>
            {(modality === 'aire_libre' || modality === 'sala' || modality === null) && (
              <div>
                <label className="label">Distancia (m)</label>
                <input name="distance_meters" type="number" min={1} defaultValue={18} className="input" />
              </div>
            )}
          </div>

          {modality && config?.hasSeries && (
            <div>
              <label className="label">Número de series</label>
              <div className="flex gap-2">
                {[1, 2].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setSeriesCount(n); setEnds([]) }}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      seriesCount === n
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {n} serie{n > 1 ? 's' : ''} — máx. {config.endsPerSeries * n * config.arrowsPerEnd * config.maxScore} pts
                  </button>
                ))}
              </div>
            </div>
          )}

          {modality && config?.hasDianas && (
            <div>
              <label className="label">Número de dianas del recorrido</label>
              <input
                type="number" min={1} max={48} value={dianaCount}
                onChange={e => { setDianaCount(Number(e.target.value)); setEnds([]) }}
                className="input"
              />
            </div>
          )}

          <div>
            <label className="label">Nombre de la competición *</label>
            <input name="competition_name" type="text" required className="input" placeholder="Ej: Campeonato Regional de Sala 2025" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoría</label>
              <input name="category" type="text" className="input" placeholder="Recurvo Senior Masc." />
            </div>
            <div>
              <label className="label">Ronda / Formato</label>
              <input name="round_type" type="text" className="input" placeholder="WA 1440, FITA 18..." />
            </div>
          </div>
        </div>

        {/* Modo control */}
        {modality && (
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Modo control</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {controlMode ? 'Puntuación tanda a tanda con tablilla' : 'Solo puntuación total'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setControlMode(!controlMode); setEnds([]) }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                controlMode ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                controlMode ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        )}
		
		{controlMode && modality && (
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Modo diana</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Marca cada impacto directamente en la diana
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setDianaMode(!dianaMode); setEnds([]) }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                dianaMode ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                dianaMode ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        )}

        {/* Tandas — Modo Control */}
        {controlMode && modality && (
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Tandas {ends.length}/{totalEndsExpected}
              </h2>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{totalScore} pts</p>
                <p className="text-xs text-slate-400">
                  {percentage !== null ? `${percentage}% · ` : ''}{avgPerArrow} pts/flecha
                </p>
              </div>
            </div>

            {ends.length > 0 && (
              <div className="space-y-1.5">
                {ends.map((end, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5">
                    <span className="text-xs text-slate-400 w-6">#{end.end_number}</span>
                    <div className="flex gap-1 flex-1">
                      {end.arrow_scores.map((s, j) => (
                        <span key={j} className={`w-7 h-7 rounded-md text-xs flex items-center justify-center font-bold ${
                          s === 'X' || s === '10' || s === '9' || (modality === 'campo' && (s === '6' || s === '5'))
                            ? 'bg-yellow-300 text-yellow-900'
                            : s === '8' || s === '7' || (modality === '3d' && s === '11')
                            ? 'bg-red-500 text-white'
                            : s === '6' || s === '5'
                            ? 'bg-blue-500 text-white'
                            : s === '4' || s === '3' || (modality === 'campo' && ['4','3','2','1'].includes(s))
                            ? 'bg-gray-900 text-white'
                            : 'bg-white border border-gray-300 text-gray-500'
                        }`}>
                          {s}
                        </span>
                      ))}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{end.score}</span>
                  </div>
                ))}
                <button type="button" onClick={removeLastEnd} className="text-xs text-red-400 hover:text-red-500 px-1">
                  ← Deshacer última tanda
                </button>
              </div>
            )}

           {!sessionComplete ? (
              dianaMode ? (
                <ArcheryTarget
                  modality={modality}
                  endNumber={currentEndNumber}
                  arrowsPerEnd={config.arrowsPerEnd}
                  onEndComplete={(end) => handleEndComplete({
                    end_number: end.end_number,
                    arrows: end.arrows,
                    score: end.score,
                    arrow_scores: end.arrow_scores,
                    impacts: end.impacts,
                  })}
                />
              ) : (
                <ScoreBoard
                  modality={modality}
                  endNumber={currentEndNumber}
                  onEndComplete={handleEndComplete}
                />
              )
            ) : (
              <div className="text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-green-700 dark:text-green-400 font-medium">✅ Competición completa</p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  {totalScore} / {maxScore} pts ({percentage}%) · {avgPerArrow} pts/flecha
                </p>
              </div>
            )}
          </div>
        )}

        {/* Resultado manual (modo libre) */}
        {!controlMode && (
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Resultado</h2>

            <div>
              <label className="label">Puntuación total *</label>
              <input name="total_score" type="number" min={0} required className="input text-2xl font-bold h-14" placeholder="0" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">
                  {modality === '3d' ? '11s' : modality === 'campo' ? '6s' : 'X'}
                </label>
                <input name="x_count" type="number" min={0} defaultValue={0} className="input" />
              </div>
              <div>
                <label className="label">
                  {modality === '3d' ? '10s' : modality === 'campo' ? '5s' : modality === 'sala' ? '9s' : '10s'}
                </label>
                <input name="tens_count" type="number" min={0} defaultValue={0} className="input" />
              </div>
              <div>
                <label className="label">Posición</label>
                <input name="ranking_position" type="number" min={1} className="input" placeholder="—" />
              </div>
            </div>
          </div>
        )}

        {/* Resultado modo control — solo X y posición */}
        {controlMode && sessionComplete && (
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Detalles adicionales</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">
                  {modality === '3d' ? '11s' : modality === 'campo' ? '6s' : 'X'}
                </label>
                <input name="x_count" type="number" min={0} value={autoXCount} onChange={() => {}} className="input bg-slate-50 dark:bg-slate-800" readOnly />
              </div>
              <div>
                <label className="label">
                  {modality === '3d' ? '10s' : modality === 'campo' ? '5s' : modality === 'sala' ? '9s' : '10s'}
                </label>
                <input name="tens_count" type="number" min={0} value={autoTensCount} onChange={() => {}} className="input bg-slate-50 dark:bg-slate-800" readOnly />
              </div>
              <div>
                <label className="label">Posición</label>
                <input name="ranking_position" type="number" min={1} className="input" placeholder="—" />
              </div>
            </div>
            <div>
              <label className="label">Notas</label>
              <textarea name="notes" rows={2} className="input resize-none" placeholder="Condiciones, sensaciones..." />
            </div>
          </div>
        )}

        {!controlMode && (
          <div className="card p-6">
            <label className="label">Notas</label>
            <textarea name="notes" rows={3} className="input resize-none" placeholder="Condiciones, sensaciones, observaciones..." />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <Link href="/competitions/history" className="btn-secondary flex-1 justify-center">Cancelar</Link>
          <button
            type="submit"
            disabled={loading || (controlMode && ends.length === 0)}
            className="btn-primary flex-1 justify-center"
          >
            {loading ? 'Guardando...' : 'Guardar resultado'}
          </button>
        </div>
      </form>
    </div>
  )
}
