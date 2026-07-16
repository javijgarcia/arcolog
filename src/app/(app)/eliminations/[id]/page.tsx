import { notFound } from 'next/navigation'
import { getBracket } from '@/lib/actions/eliminations'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MODALITY_LABELS } from '@/types'
import { ChevronLeft, Trophy } from 'lucide-react'
import Link from 'next/link'
import { BracketView } from './BracketView'
import { StartBracketButton } from './StartBracketButton'
import { CopyLinkButton } from './CopyLinkButton'
import { DeleteBracketButton } from './DeleteBracketButton'

export default async function EliminationDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const bracket = await getBracket(params.id)
  if (!bracket) notFound()

  const isOwner = bracket.created_by === user.id
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/public/bracket/${bracket.public_token}`

  const rounds = Math.log2(bracket.participant_count)
  const roundNames: Record<number, string> = {
    1: bracket.participant_count === 4 ? 'Semifinales' :
       bracket.participant_count === 8 ? 'Cuartos de final' :
       bracket.participant_count === 16 ? 'Octavos de final' : 'Dieciseisavos',
    2: bracket.participant_count === 8 ? 'Semifinales' :
       bracket.participant_count === 16 ? 'Cuartos de final' : 'Octavos de final',
    3: bracket.participant_count === 16 ? 'Semifinales' : 'Cuartos de final',
    4: 'Semifinales',
    5: 'Final',
  }
  roundNames[rounds] = 'Final'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/eliminations" className="btn-ghost p-2">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{bracket.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {MODALITY_LABELS[bracket.modality as keyof typeof MODALITY_LABELS]} ·{' '}
              {bracket.participant_count} arqueros ·{' '}
           {bracket.arrows_per_set} flechas/entrada ·{' '}
              {bracket.format_type === 'compuesto'
                ? `${bracket.sets_to_win} entradas acumulativas`
                : `mejor de ${bracket.sets_to_win * 2} sets`}
            </p>
          </div>
        </div>
       <div className="flex gap-2 shrink-0">
          <CopyLinkButton url={publicUrl} />
          {isOwner && bracket.status === 'draft' && (
            <StartBracketButton bracketId={bracket.id} />
          )}
          {isOwner && (
            <DeleteBracketButton bracketId={bracket.id} />
          )}
       </div>
      </div>

      {/* Estado */}
      <div className={`card p-4 flex items-center gap-3 ${
        bracket.status === 'completed' ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
        : bracket.status === 'active' ? 'border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/10'
        : 'border-slate-200 dark:border-slate-700'
      }`}>
        <Trophy className={`w-5 h-5 ${
          bracket.status === 'completed' ? 'text-green-500'
          : bracket.status === 'active' ? 'text-brand-500'
          : 'text-slate-400'
        }`} />
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {bracket.status === 'completed' ? '🏆 Eliminatorias finalizadas'
          : bracket.status === 'active' ? '⚡ En curso'
          : '📋 Borrador — pulsa "Iniciar" para comenzar'}
        </p>
      </div>

      {/* Cuadro */}
      <BracketView
        bracket={bracket as any}
        roundNames={roundNames}
        isOwner={isOwner}
        currentUserId={user.id}
      />
    </div>
  )
}