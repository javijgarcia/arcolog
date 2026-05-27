'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCompetitionScore } from '@/lib/actions/competitions'
import { Trash2 } from 'lucide-react'

export function DeleteCompetitionButton({ competitionId }: { competitionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar esta competición?')) return
    setLoading(true)
    await deleteCompetitionScore(competitionId)
    router.push('/competitions/history')
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}