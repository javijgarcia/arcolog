'use client'

import { useState } from 'react'
import { createScheduledTraining } from '@/lib/actions/scheduled'
import { useRouter } from 'next/navigation'
import { MODALITY_LABELS } from '@/types'
import type { Modality } from '@/types'
import { Calendar } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

export function ScheduleForm({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('group_id', groupId)
    const result = await createScheduledTraining(formData)
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
        className="btn-primary w-full justify-center"
      >
        <Calendar className="w-4 h-4" />
        Programar entrenamiento
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
      <h3 className="font-medium text-slate-900 dark:text-white">Nuevo entrenamiento programado</h3>

      <div>
        <label className="label">Fecha *</label>
        <input name="scheduled_date" type="date" required defaultValue={today} className="input" />
      </div>

      <div>
        <label className="label">Modalidad</label>
        <select name="modality" className="input" defaultValue="">
          <option value="">Sin especificar</option>
          {Object.entries(MODALITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Distancia (m)</label>
        <input name="distance_meters" type="number" min={1} className="input" placeholder="18" />
      </div>

      <div>
        <label className="label">Objetivo</label>
        <input name="objective" type="text" className="input" placeholder="Trabajar postura, fuerza..." />
      </div>

      <div>
        <label className="label">Notas</label>
        <textarea name="notes" rows={2} className="input resize-none" placeholder="Indicaciones para los arqueros..." />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Guardando...' : 'Programar'}
        </button>
      </div>
    </form>
  )
}