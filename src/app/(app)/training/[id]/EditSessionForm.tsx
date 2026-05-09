'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTrainingSessionBasic } from '@/lib/actions/training'
import { WEATHER_LABELS, FEELING_LABELS } from '@/types'
import type { Weather } from '@/types'
import { Pencil, X } from 'lucide-react'

interface Props {
  session: {
    id: string
    session_date: string
    distance_meters: number
    objective: string | null
    feeling_score: number | null
    weather: string | null
    notes: string | null
  }
}

export function EditSessionForm({ session }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = await updateTrainingSessionBasic(session.id, {
      session_date: fd.get('session_date') as string,
      distance_meters: Number(fd.get('distance_meters') || 0),
      objective: fd.get('objective') as string,
      feeling_score: Number(fd.get('feeling_score')),
      weather: fd.get('weather') as string,
      notes: fd.get('notes') as string,
    })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost p-2 text-slate-400 hover:text-brand-500"
      >
        <Pencil className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-900 dark:text-white">Editar sesión</h3>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha</label>
            <input name="session_date" type="date" defaultValue={session.session_date} required className="input" />
          </div>
          <div>
            <label className="label">Distancia (m)</label>
            <input name="distance_meters" type="number" min={0} defaultValue={session.distance_meters || ''} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Tiempo / Lugar</label>
          <select name="weather" defaultValue={session.weather ?? 'interior'} className="input">
            {Object.entries(WEATHER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Objetivo</label>
          <input name="objective" type="text" defaultValue={session.objective ?? ''} className="input" placeholder="Ej: Trabajar postura..." />
        </div>

        <div>
          <label className="label">¿Cómo te sentiste?</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <label key={n} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="feeling_score"
                  value={n}
                  defaultChecked={n === (session.feeling_score ?? 3)}
                  className="sr-only peer"
                />
                <div className="peer-checked:ring-2 peer-checked:ring-brand-500 peer-checked:bg-brand-50 dark:peer-checked:bg-brand-900/30 rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-center text-lg transition-all">
                  {FEELING_LABELS[n].split(' ')[0]}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea name="notes" rows={2} defaultValue={session.notes ?? ''} className="input resize-none" placeholder="Observaciones..." />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}