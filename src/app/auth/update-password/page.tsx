'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Procesar el hash de la URL manualmente
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(() => {
        setReady(true)
      })
    } else {
      // Intentar con la sesión existente
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true)
        else setError('Enlace inválido o expirado. Solicita uno nuevo.')
      })
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  if (error && !ready) {
    return (
      <>
        <div className="mb-6 text-center">
          <div className="text-4xl mb-3">❌</div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Enlace inválido</h1>
          <p className="text-sm text-red-500 mt-2">{error}</p>
        </div>
        <a href="/auth/reset-password" className="btn-primary w-full justify-center">
          Solicitar nuevo enlace
        </a>
      </>
    )
  }

  if (!ready) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">Verificando enlace...</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Nueva contraseña</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Elige una contraseña segura para tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nueva contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </>
  )
}