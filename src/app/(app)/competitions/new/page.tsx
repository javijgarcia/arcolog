'use client'

import { useState } from 'react'
import { createCompetitionScore } from '@/lib/actions/competitions'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

export default function NewCompetitionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const result = await createCompetitionScore({
      competition_date: fd.get('competition_date') as string,
      competition_name: fd.get('competition_name') as string,
      category: fd.get('category') as string,
      distance_meters: Number(fd.get('distance_meters')),
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
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Datos del torneo</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha</label>
              <input name="competition_date" type="date" defaultValue={today} required className="input" />
            </div>
            <div>
              <label className="label">Distancia (m)</label>
              <input name="distance_meters" type="number" min={1} defaultValue={18} className="input" />
            </div>
          </div>

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

        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Resultado</h2>

          <div>
            <label className="label">Puntuación total *</label>
            <input name="total_score" type="number" min={0} required className="input text-2xl font-bold h-14" placeholder="0" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">X</label>
              <input name="x_count" type="number" min={0} defaultValue={0} className="input" />
            </div>
            <div>
              <label className="label">10s</label>
              <input name="tens_count" type="number" min={0} defaultValue={0} className="input" />
            </div>
            <div>
              <label className="label">Posición</label>
              <input name="ranking_position" type="number" min={1} className="input" placeholder="—" />
            </div>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea name="notes" rows={3} className="input resize-none" placeholder="Condiciones, sensaciones, observaciones..." />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <Link href="/competitions/history" className="btn-secondary flex-1 justify-center">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Guardando...' : 'Guardar resultado'}
          </button>
        </div>
      </form>
    </div>
  )
}
