'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBracket } from '@/lib/actions/eliminations'
import { MODALITY_LABELS } from '@/types'
import type { Modality } from '@/types'
import { ChevronLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

const PARTICIPANT_COUNTS = [4, 8, 16, 32]

function NewEliminationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('group_id')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modality, setModality] = useState<Modality>('sala')
  const [formatType, setFormatType] = useState<'sets' | 'compuesto'>('sets')
  const [participantCount, setParticipantCount] = useState(8)
  const [arrowsPerSet, setArrowsPerSet] = useState(3)
  const [participants, setParticipants] = useState<{ display_name: string; user_id: string | null }[]>(
    Array(8).fill(null).map(() => ({ display_name: '', user_id: null }))
  )
  const [groupMembers, setGroupMembers] = useState<{ user_id: string; display_name: string }[]>([])

  useEffect(() => {
    if (!groupId) return
    fetch(`/api/group-members?group_id=${groupId}`)
      .then(r => r.json())
      .then(data => setGroupMembers(data ?? []))
  }, [groupId])

  function handleCountChange(count: number) {
    setParticipantCount(count)
    setParticipants(prev => {
      return Array(count).fill(null).map((_, i) => prev[i] ?? { display_name: '', user_id: null })
    })
  }

  function handleNameChange(index: number, name: string) {
    const member = groupMembers.find(m => m.display_name === name)
    setParticipants(prev => prev.map((p, i) => i === index
      ? { display_name: name, user_id: member?.user_id ?? null }
      : p
    ))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const emptyNames = participants.some(p => !p.display_name.trim())
    if (emptyNames) {
      setError('Todos los participantes deben tener un nombre')
      return
    }

    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const result = await createBracket({
      title: fd.get('title') as string,
      modality,
      format_type: formatType,
      arrows_per_set: arrowsPerSet,
      sets_to_win: formatType === 'compuesto' ? 5 : 3,
      participant_count: participantCount,
      group_id: groupId,
      participants: participants.map(p => ({ display_name: p.display_name.trim(), user_id: p.user_id })),
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/eliminations/${result.bracketId}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={groupId ? `/groups/${groupId}` : '/eliminations'} className="btn-ghost p-2">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1>Nuevo cuadro</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Configura las eliminatorias</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Configuracion</h2>

          <div>
            <label className="label">Nombre del cuadro *</label>
            <input name="title" type="text" required className="input" placeholder="Ej: Eliminatorias Club Sala 2025" />
          </div>

          <div>
            <label className="label">Formato</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setFormatType('sets'); setArrowsPerSet(3) }}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                  formatType === 'sets'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Por sets
                <p className="text-xs font-normal mt-0.5 opacity-70">Recurvo, Longbow, Desnudo, Tradicional</p>
              </button>
              <button
                type="button"
                onClick={() => { setFormatType('compuesto'); setArrowsPerSet(3) }}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                  formatType === 'compuesto'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Compuesto
                <p className="text-xs font-normal mt-0.5 opacity-70">5 entradas acumulativas - max. 150 pts</p>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Modalidad</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(MODALITY_LABELS) as [Modality, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setModality(key)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
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

          {formatType === 'sets' && (
            <div>
              <label className="label">Flechas por entrada</label>
              <div className="flex gap-2">
                {[3, 6].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setArrowsPerSet(n)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      arrowsPerSet === n
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {n} flechas {n === 3 ? '(individual)' : '(equipos)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formatType === 'compuesto' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Formato compuesto</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                3 flechas por entrada - 5 entradas - maximo 150 puntos - gana quien mas acumule
              </p>
            </div>
          )}

          <div>
            <label className="label">Numero de participantes</label>
            <div className="grid grid-cols-4 gap-2">
              {PARTICIPANT_COUNTS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCountChange(n)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    participantCount === n
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4" />
            Participantes ({participantCount})
          </h2>
          <p className="text-xs text-slate-400">
            {groupMembers.length > 0
              ? 'Selecciona del desplegable o escribe un nombre libre'
              : 'El orden se sortea aleatoriamente'}
          </p>

          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-6 text-right">{i + 1}</span>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={p.display_name}
                    onChange={e => handleNameChange(i, e.target.value)}
                    className="input w-full"
                    placeholder={`Arquero ${i + 1}${groupMembers.length > 0 ? ' o nombre libre' : ''}`}
                    list={groupMembers.length > 0 ? `members-list-${i}` : undefined}
                  />
                  {groupMembers.length > 0 && (
                    <datalist id={`members-list-${i}`}>
                      {groupMembers.map(m => (
                        <option key={m.user_id} value={m.display_name} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <Link href={groupId ? `/groups/${groupId}` : '/eliminations'} className="btn-secondary flex-1 justify-center">Cancelar</Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Creando...' : 'Crear cuadro'}
          </button>
        </div>
      </form>
    </div>
  )
}
export default function NewEliminationPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-8 text-center text-slate-400">Cargando...</div>}>
      <NewEliminationContent />
    </Suspense>
  )
}
