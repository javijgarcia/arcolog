'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '@/lib/actions/groups'

export function CreateGroupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await createGroup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      router.push(`/groups/${result.groupId}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Nombre del grupo *</label>
        <input name="name" type="text" required className="input" placeholder="Club Arco Murcia — Sala" />
      </div>
      <div>
        <label className="label">Descripción (opcional)</label>
        <input name="description" type="text" className="input" placeholder="Grupo de entrenamiento de sala..." />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Creando...' : 'Crear grupo'}
      </button>
    </form>
  )
}