import { getProfile } from '@/lib/actions/profile'
import { updateProfile } from '@/lib/actions/profile'
import { BOW_TYPE_LABELS } from '@/types'
import { UserCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi perfil' }

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1>Mi perfil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Información de tu cuenta y equipo</p>
      </div>

      {/* Avatar placeholder */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
          <UserCircle className="w-9 h-9 text-brand-500" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{profile?.full_name ?? 'Arquero'}</p>
          {profile?.club_name && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{profile.club_name}</p>
          )}
          {profile?.bow_type && (
            <span className="badge-blue mt-1 inline-block">{BOW_TYPE_LABELS[profile.bow_type]}</span>
          )}
        </div>
      </div>

      {/* Form */}
      <form action={updateProfile as (formData: FormData) => void} className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Editar información</h2>

        <div>
          <label className="label">Nombre completo</label>
          <input
            name="full_name"
            type="text"
            defaultValue={profile?.full_name ?? ''}
            className="input"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label className="label">Club / Federación</label>
          <input
            name="club_name"
            type="text"
            defaultValue={profile?.club_name ?? ''}
            className="input"
            placeholder="Club Arco Murcia..."
          />
        </div>

        <div>
          <label className="label">Tipo de arco</label>
          <select name="bow_type" defaultValue={profile?.bow_type ?? ''} className="input">
            <option value="">Sin especificar</option>
            {Object.entries(BOW_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary w-full justify-center">
          Guardar cambios
        </button>
      </form>
    </div>
  )
}
