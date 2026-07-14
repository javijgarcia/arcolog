import { getBrackets } from '@/lib/actions/eliminations'
import { formatDate } from '@/lib/utils'
import { MODALITY_LABELS } from '@/types'
import { Trophy, Plus, Eye } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Eliminatorias' }

export default async function EliminationsPage() {
  const brackets = await getBrackets()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Eliminatorias</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Crea y gestiona cuadros de eliminatorias
          </p>
        </div>
        <Link href="/eliminations/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo cuadro
        </Link>
      </div>

      {brackets.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Sin eliminatorias todavía</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Crea tu primer cuadro de eliminatorias para empezar
          </p>
          <Link href="/eliminations/new" className="btn-primary">
            Crear cuadro
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {brackets.map((b: any) => (
            <div key={b.id} className="card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">{b.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {MODALITY_LABELS[b.modality as keyof typeof MODALITY_LABELS]}
                  {' - '}{b.participant_count} arqueros
                  {' - '}{formatDate(b.created_at)}
                  {' - '}
                  <span className={`font-medium ${
                    b.status === 'completed' ? 'text-green-600 dark:text-green-400'
                    : b.status === 'active' ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400'
                  }`}>
                    {b.status === 'completed' ? 'Finalizado' : b.status === 'active' ? 'En curso' : 'Borrador'}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`/public/bracket/${b.public_token}`}
                  target="_blank"
                  className="btn-secondary p-2"
                  title="Ver enlace publico"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <Link href={`/eliminations/${b.id}`} className="btn-primary text-sm py-2">
                  Gestionar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
