'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBracket } from '@/lib/actions/eliminations'
import { Trash2 } from 'lucide-react'

export function DeleteBracketButton({ bracketId }: { bracketId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar este cuadro de eliminatorias? Esta acción no se puede deshacer.')) return
    setLoading(true)
    const result = await deleteBracket(bracketId)
    if (result?.error) {
      alert(result.error)
      setLoading(false)
      return
    }
    router.push('/eliminations')
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