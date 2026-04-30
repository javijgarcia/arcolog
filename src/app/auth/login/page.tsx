'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import type { Metadata } from 'next'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Bienvenido</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Inicia sesión en tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Link href="/auth/reset-password" className="text-xs text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-6">
        ¿Sin cuenta?{' '}
        <Link href="/auth/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </>
  )
}
