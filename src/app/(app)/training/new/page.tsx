'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createTrainingSession } from '@/lib/actions/training'
import { ScoreBoard } from '@/components/training/ScoreBoard'
import {
  MODALITY_LABELS, MODALITY_CONFIG, WEATHER_LABELS, FEELING_LABELS,
} from '@/types'
import type { Modality, Weather, SessionEndForm } from '@/types'

const today = new Date().toISOString().split('T')[0]

export default function NewTrainingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modality, setModality] = useState<Modality>('sala')
  const [seriesCount, setSeriesCount] = useState(2)
  const [dianaCount, setDianaCount] = useState(24)
  const [ends, setEnds] = useState<SessionEndForm[]>([])
  const [controlMode, setControlMode] = useState(false)
  const [freeArrows, setFreeArrows] = useState<number | ''>('')
  const [freeScore, setFreeScore] = useState<number | ''>('')
  const [extraArrows, setExtraArrows] = useState<number | ''>('')
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const config = MODALITY_CONFIG[modality]
  const totalEndsExpected = config.hasDianas ? dianaCount : config.endsPerSeries * seriesCount
  const maxScore = config.hasDianas
    ? dianaCount * config.arrowsPerEnd * config.maxScore
    : config.endsPerSeries * seriesCount * config.arrowsPerEnd * config.maxScore

  const totalScore = controlMode ? ends.reduce((s, e) => s + e.score, 0) : Number(freeScore) || 0
  const totalArrows = controlMode
    ? ends.reduce((s, e) => s + e.arrows, 0) + (Number(extraArrows) || 0)
    : Number(freeArrows) || 0
  const avgPerArrow = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : '—'
  const percentage = maxScore > 0 && controlMode ? Math.round((totalScore / maxScore) * 100) : null
  const currentEndNumber = ends.length + 1
  const sessionComplete = controlMode && ends.length >= totalEndsExpected

  function handleEndComplete(end: SessionEndForm) {
    setEnds(prev => [...prev, end])
  }

  function removeLastEnd() {
    setEnds(prev => prev.slice(0, -1))
  }

  function handleModalityChange(m: Modality) {
    setModality(m)
    setEnds([])
  }

  async function loadLastSession() {
    setLoadingTemplate(true)
    try {
      const res = await fetch('/api/last-session')
      const data = await res.json()
      if (data && formRef.current) {
        const form = formRef.current
        const distanceInput = form.querySelector<HTMLInputElement>('[name="distance_meters"]')
        const weatherSelect = form.querySelector<HTMLSelectElement>('[name="weather"]')
        const objectiveInput = form.querySelector<HTMLInputElement>('[name="objective"]')
        if (distanceInput && data.distance_meters) distanceInput.value = data.distance_meters
        if (weatherSelect && data.weather) weatherSelect.value = data.weather
        if (objectiveInput && data.objective) objectiveInput.value = data.objective
        if (data.modality) handleModalityChange(data.modality)
        if (data.series_count) setSeriesCount(data.series_count)
        if (data.diana_count) setDianaCount(data.diana_count)
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingTemplate(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mod = params.get('modality') as Modality | null
    const distance = params.get('distance')
    const objective = params.get('objective')

    if (mod && Object.keys(MODALITY_CONFIG).includes(mod)) {
      handleModalityChange(mod)
    }
    if (objective && formRef.current) {
      const objectiveInput = formRef.current.querySelector<HTMLInputElement>('[name="objective"]')
      if (objectiveInput) objectiveInput.value = decodeURIComponent(objective)
    }
    if (distance && formRef.current) {
      const distanceInput = formRef.current.querySelector<HTMLInputElement>('[name="distance_meters"]')
      if (distanceInput) distanceInput.value = distance
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (controlMode && ends.length === 0) {
      setError('Añade al menos una tanda antes de guardar.')
      return
    }
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = await createTrainingSession({
      session_date: fd.get('session_date') as string,
      distance_meters: Number(fd.get('distance_meters') || 0),
      modality,
      series_count: seriesCount,
      diana_count: config.hasDianas ? dianaCount : null,
      diana_paper: config.hasDianaPaper ? fd.get('diana_paper') as string : null,
      objective: fd.get('objective') as string,
      feeling_score: Number(fd.get('feeling_score')),
      weather: fd.get('weather') as Weather,
      notes: fd.get('notes') as string,
      extra_arrows: Number(extraArrows) || 0,
      ends: controlMode ? ends : freeArrows ? [{
        end_number: 1,
        arrows: Number(freeArrows),
        score: Number(freeScore) || 0,
        arrow_scores: [],
      }] : [],
    })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="btn-ghost p-2">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1>Nuevo entrenamiento</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Registra tu sesión de hoy</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} ref={formRef} className="space-y-6">

        <button
          type="button"
          onClick={loadLastSession}
          disabled={loadingTemplate}
          className="btn-secondary w-full justify-center"
        >
          {loadingTemplate ? 'Cargando...' : '🔄 Repetir último entreno'}
        </button>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Modo control</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {controlMode ? 'Puntuación tanda a tanda con tablilla' : 'Solo total de flechas y puntuación'}
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

          {controlMode && config.hasSeries && (
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

          {controlMode && config.hasDianas && (
            <div>
              <label className="label">Número de dianas del recorrido</label>
              <input
                type="number" min={1} max={48} value={dianaCount}
                onChange={e => { setDianaCount(Number(e.target.value)); setEnds([]) }}
                className="input"
              />
            </div>
          )}

          <div className={`grid gap-4 ${config.hasDianas ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <div>
              <label className="label">Fecha</label>
              <input name="session_date" type="date" defaultValue={today} required className="input" />
            </div>
            {!config.hasDianas && (
              <div>
                <label className="label">Distancia (m)</label>
                <input name="distance_meters" type="number" min={1} max={100} defaultValue={18} required className="input" />
              </div>
            )}
            {config.hasDianas && <input name="distance_meters" type="hidden" value="0" />}
          </div>

          {config.hasDianaPaper && (
            <div>
              <label className="label">Papel de diana</label>
              <input name="diana_paper" type="text" className="input" placeholder="Ej: 40cm, 60cm, 122cm..." />
            </div>
          )}

          <div>
            <label className="label">Tiempo / Lugar</label>
            <select name="weather" className="input" defaultValue="interior">
              {Object.entries(WEATHER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Objetivo del entreno</label>
            <input name="objective" type="text" className="input" placeholder="Ej: Trabajar postura, fuerza, puntería..." />
          </div>

          <div>
            <label className="label">¿Cómo te has sentido?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <label key={n} className="flex-1 cursor-pointer">
                  <input type="radio" name="feeling_score" value={n} defaultChecked={n === 3} className="sr-only peer" />
                  <div className="peer-checked:ring-2 peer-checked:ring-brand-500 peer-checked:bg-brand-50 dark:peer-checked:bg-brand-900/30 rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-center text-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                    {FEELING_LABELS[n].split(' ')[0]}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notas (opcional)</label>
            <textarea name="notes" rows={2} className="input resize-none" placeholder="Observaciones, lesiones, ajustes al arco..." />
          </div>
        </div>

        {controlMode && (
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
              <ScoreBoard
                modality={modality}
                endNumber={currentEndNumber}
                onEndComplete={handleEndComplete}
              />
            ) : (
              <div className="text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-green-700 dark:text-green-400 font-medium">✅ Sesión completa</p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  {totalScore} / {maxScore} pts ({percentage}%) · {avgPerArrow} pts/flecha
                </p>
              </div>
            )}

            {sessionComplete && (
              <div>
                <label className="label">Flechas adicionales <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input
                  type="number"
                  min={0}
                  value={extraArrows}
                  onChange={e => setExtraArrows(e.target.value ? Number(e.target.value) : '')}
                  className="input"
                  placeholder="Flechas tiradas fuera del control"
                />
                <p className="text-xs text-slate-400 mt-1">Solo cuentan para el volumen total, no para la puntuación</p>
              </div>
            )}
          </div>
        )}

        {!controlMode && (
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Resumen del entreno</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total de flechas <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input
                  type="number" min={1}
                  value={freeArrows}
                  onChange={e => setFreeArrows(e.target.value ? Number(e.target.value) : '')}
                  className="input"
                  placeholder="72"
                />
              </div>
              <div>
                <label className="label">Puntuación total <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input
                  type="number" min={0}
                  value={freeScore}
                  onChange={e => setFreeScore(e.target.value ? Number(e.target.value) : '')}
                  className="input"
                  placeholder="540"
                />
              </div>
            </div>
            {freeArrows && freeScore && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                Media: <strong>{(Number(freeScore) / Number(freeArrows)).toFixed(2)} pts/flecha</strong>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Link href="/dashboard" className="btn-secondary flex-1 justify-center">Cancelar</Link>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar sesión'}
          </button>
        </div>
      </form>
    </div>
  )
}
