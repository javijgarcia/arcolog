'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startBracket } from '@/lib/actions/eliminations'
import { Play } from 'lucide-react'

export function StartBracketButton({ bracketId }: { bracketId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    if (!confirm('¿Iniciar las eliminatorias? Una vez iniciadas no se pueden editar los participantes.')) return
    setLoading(true)
    const result = await startBracket(bracketId)
    if (result?.error) {
      alert(result.error)
      setLoading(false)
      return
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={loading}
      className="btn-primary flex items-center gap-2"
    >
      <Play className="w-4 h-4" />
      {loading ? 'Iniciando...' : 'Iniciar'}
    </button>
  )
}