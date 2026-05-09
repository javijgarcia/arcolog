'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCompetitionScore } from '@/lib/actions/competitions'
import { MODALITY_LABELS, COMPETITION_TYPE_LABELS } from '@/types'
import type { Modality } from '@/types'
import { Pencil, X } from 'lucide-react'

interface Props {
  competition: {
    id: string
    competition_date: string
    competition_name: string
    category: string | null
    modality: string | null
    competition_type: string | null
    distance_meters: number | null
    round_type: string | null
    total_score: number
    x_count: number
    tens_count: number
    ranking_position: number | null
    notes: string | null
  }
}

export function EditCompetitionForm({ competition }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modality, setModality] = useState<string>(competition.modality ?? '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = await updateCompetitionScore(competition.id, {
      competition_date: fd.get('competition_date') as string,
      competition_name: fd.get('competition_name') as string,
      category: fd.get('category') as string,
      modality: modality as Modality || null,
      competition_type: fd.get('competition_type') as any || null,
      distance_meters: Number(fd.get('distance_meters') || 0),
      round_type: fd.get('round_type') as string,
      total_score: Number(fd.get('total_score')),
      x_count: Number(fd.get('x_count') || 0),
      tens_count: Number(fd.get('tens_count') || 0),
      ranking_position: fd.get('ranking_position') ? Number(fd.get('ranking_position')) : null,
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
        <h3 className="font-medium text-slate-900 dark:text-white">Editar competición</h3>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha</label>
            <input name="competition_date" type="date" defaultValue={competition.competition_date} required className="input" />
          </div>
          <div>
            <label className="label">Distancia (m)</label>
            <input name="distance_meters" type="number" min={0} defaultValue={competition.distance_meters ?? ''} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Nombre *</label>
          <input name="competition_name" type="text" required defaultValue={competition.competition_name} className="input" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Categoría</label>
            <input name="category" type="text" defaultValue={competition.category ?? ''} className="input" />
          </div>
          <div>
            <label className="label">Ronda</label>
            <input name="round_type" type="text" defaultValue={competition.round_type ?? ''} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Modalidad</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(MODALITY_LABELS) as [string, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setModality(modality === key ? '' : key)}
                className={`p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                  modality === key
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Tipo</label>
          <select name="competition_type" defaultValue={competition.competition_type ?? ''} className="input">
            <option value="">Sin especificar</option>
            {Object.entries(COMPETITION_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Puntuación total *</label>
          <input name="total_score" type="number" min={0} required defaultValue={competition.total_score} className="input text-xl font-bold h-12" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">{modality === '3d' ? '11s' : modality === 'campo' ? '6s' : 'X'}</label>
            <input name="x_count" type="number" min={0} defaultValue={competition.x_count ?? 0} className="input" />
          </div>
          <div>
            <label className="label">{modality === '3d' ? '10s' : modality === 'campo' ? '5s' : modality === 'sala' ? '9s' : '10s'}</label>
            <input name="tens_count" type="number" min={0} defaultValue={competition.tens_count ?? 0} className="input" />
          </div>
          <div>
            <label className="label">Posición</label>
            <input name="ranking_position" type="number" min={1} defaultValue={competition.ranking_position ?? ''} className="input" placeholder="—" />
          </div>
        </div>

        <div>
          <label className="label">Notas</label>
          <textarea name="notes" rows={2} defaultValue={competition.notes ?? ''} className="input resize-none" />
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