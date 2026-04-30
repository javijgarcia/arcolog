'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinGroup } from '@/lib/actions/groups'

export function JoinGroupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await joinGroup(formData)
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
        <label className="label">Código de invitación *</label>
        <input
          name="invite_code"
          type="text"
          required
          maxLength={8}
          className="input uppercase tracking-widest font-mono text-center text-lg"
          placeholder="XXXXXXXX"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Uniéndose...' : 'Unirse al grupo'}
      </button>
    </form>
  )
}