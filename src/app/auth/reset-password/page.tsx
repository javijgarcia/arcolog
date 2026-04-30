'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <>
        <div className="mb-6 text-center">
          <div className="text-4xl mb-3">📧</div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Email enviado</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.
          </p>
        </div>
        <Link href="/auth/login" className="btn-secondary w-full justify-center">
          Volver al inicio de sesión
        </Link>
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Recuperar contraseña</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            placeholder="tu@email.com"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>

      <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-6">
        <Link href="/auth/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </>
  )
}