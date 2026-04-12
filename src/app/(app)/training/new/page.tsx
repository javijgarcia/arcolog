'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2, ChevronLeft } from 'lucide-react'
import { createTrainingSession } from '@/lib/actions/training'
import type { SessionEndForm, TargetType, Weather } from '@/types'
import { TARGET_TYPE_LABELS, WEATHER_LABELS, FEELING_LABELS } from '@/types'
import Link from 'next/link'

const today = new Date().toISOString().split('T')[0]

export default function NewTrainingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ends, setEnds] = useState<SessionEndForm[]>([
    { end_number: 1, arrows: 6, score: 0 },
  ])

  function addEnd() {
    setEnds(prev => [...prev, { end_number: prev.length + 1, arrows: 6, score: 0 }])
  }

  function removeEnd(idx: number) {
    setEnds(prev => prev.filter((_, i) => i !== idx).map((e, i) => ({ ...e, end_number: i + 1 })))
  }

  function updateEnd(idx: number, field: keyof SessionEndForm, value: string | number) {
    setEnds(prev => prev.map((e, i) => i === idx ? { ...e, [field]: Number(value) } : e))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const result = await createTrainingSession({
      session_date: fd.get('session_date') as string,
      distance_meters: Number(fd.get('distance_meters')),
      target_type: fd.get('target_type') as TargetType,
      objective: fd.get('objective') as string,
      feeling_score: Number(fd.get('feeling_score')),
      weather: fd.get('weather') as Weather,
      notes: fd.get('notes') as string,
      ends,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const totalScore = ends.reduce((s, e) => s + e.score, 0)
  const totalArrows = ends.reduce((s, e) => s + e.arrows, 0)

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Información de la sesión</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha</label>
              <input name="session_date" type="date" defaultValue={today} required className="input" />
            </div>
            <div>
              <label className="label">Distancia (metros)</label>
              <input name="distance_meters" type="number" min={1} max={100} defaultValue={18} required className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de diana</label>
              <select name="target_type" className="input" defaultValue="diana_papel">
                {Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tiempo / Lugar</label>
              <select name="weather" className="input" defaultValue="interior">
                {Object.entries(WEATHER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Objetivo del entreno</label>
            <input name="objective" type="text" className="input" placeholder="Ej: Trabajar la postura, fuerza, puntería..." />
          </div>

          <div>
            <label className="label">¿Cómo te has sentido? <span className="text-slate-400 font-normal">({FEELING_LABELS[3]})</span></label>
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
            <textarea name="notes" rows={3} className="input resize-none" placeholder="Observaciones, lesiones, ajustes al arco..." />
          </div>
        </div>

        {/* Ends / Tandas */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tandas</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {totalArrows} flechas · <span className="font-semibold text-slate-900 dark:text-white">{totalScore} pts</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {ends.map((end, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-8 shrink-0">#{end.end_number}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 mb-0.5 block">Flechas</label>
                    <input
                      type="number" min={1} max={12}
                      value={end.arrows}
                      onChange={e => updateEnd(idx, 'arrows', e.target.value)}
                      className="input py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-0.5 block">Puntuación</label>
                    <input
                      type="number" min={0} max={120}
                      value={end.score}
                      onChange={e => updateEnd(idx, 'score', e.target.value)}
                      className="input py-1.5 text-sm"
                    />
                  </div>
                </div>
                {ends.length > 1 && (
                  <button type="button" onClick={() => removeEnd(idx)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addEnd} className="btn-secondary w-full justify-center">
            <PlusCircle className="w-4 h-4" />
            Añadir tanda
          </button>
        </div>

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
