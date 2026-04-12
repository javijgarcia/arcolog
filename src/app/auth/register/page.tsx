'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const full_name = formData.get('full_name') as string

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Crear cuenta</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gratis. Sin tarjeta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nombre</label>
          <input name="full_name" type="text" required className="input" placeholder="Tu nombre" />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input" placeholder="tu@email.com" />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input name="password" type="password" required minLength={8} className="input" placeholder="Mínimo 8 caracteres" />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </>
  )
}