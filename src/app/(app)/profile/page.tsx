import { getProfile, updateProfile } from '@/lib/actions/profile'
import { getEquipment, getSightMarks, saveSightMark, deleteSightMark, saveEquipment } from '@/lib/actions/equipment'
import { BOW_TYPE_LABELS } from '@/types'
import { UserCircle, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi perfil' }

export default async function ProfilePage() {
  const [profile, equipment, sightMarks] = await Promise.all([
    getProfile(),
    getEquipment(),
    getSightMarks(),
  ])

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1>Mi perfil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Información de tu cuenta y equipo</p>
      </div>

      {/* Avatar */}
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

      {/* Perfil */}
      <form action={updateProfile as any} className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Datos personales</h2>
        <div>
          <label className="label">Nombre completo</label>
          <input name="full_name" type="text" defaultValue={profile?.full_name ?? ''} className="input" placeholder="Tu nombre" />
        </div>
        <div>
          <label className="label">Club / Federación</label>
          <input name="club_name" type="text" defaultValue={profile?.club_name ?? ''} className="input" placeholder="Club Arco Murcia..." />
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
        <button type="submit" className="btn-primary w-full justify-center">Guardar cambios</button>
      </form>

      {/* Equipamiento */}
      <form action={saveEquipment as any} className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Configuración del arco</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Marca del cuerpo</label>
            <input name="marca_cuerpo" type="text" defaultValue={equipment?.marca_cuerpo ?? ''} className="input" placeholder="Hoyt, Win&Win..." />
          </div>
          <div>
            <label className="label">Marca de las palas</label>
            <input name="marca_palas" type="text" defaultValue={equipment?.marca_palas ?? ''} className="input" placeholder="Uukha, SF..." />
          </div>
          <div>
            <label className="label">Libras nominales</label>
            <input name="libras_nominales" type="number" step="0.5" defaultValue={equipment?.libras_nominales ?? ''} className="input" placeholder="36" />
          </div>
          <div>
            <label className="label">Libras reales</label>
            <input name="libras_reales" type="number" step="0.5" defaultValue={equipment?.libras_reales ?? ''} className="input" placeholder="38.5" />
          </div>
          <div>
            <label className="label">Longitud de flecha</label>
            <input name="longitud_flecha" type="number" step="0.5" defaultValue={equipment?.longitud_flecha ?? ''} className="input" placeholder="27.5" />
          </div>
          <div>
            <label className="label">Tubos</label>
            <input name="tubos" type="text" defaultValue={equipment?.tubos ?? ''} className="input" placeholder="Easton X10, ACE..." />
          </div>
          <div>
            <label className="label">Tipo de plumas</label>
            <input name="tipo_plumas" type="text" defaultValue={equipment?.tipo_plumas ?? ''} className="input" placeholder="Spin, Shield..." />
          </div>
          <div>
            <label className="label">Spine</label>
            <input name="spine" type="text" defaultValue={equipment?.spine ?? ''} className="input" placeholder="500, 700..." />
          </div>
        </div>
        <div>
          <label className="label">Apertura</label>
         <input name="apertura" type="text" defaultValue={equipment?.apertura ?? ''} className="input" placeholder="26, 28..." />
        </div>
        <button type="submit" className="btn-primary w-full justify-center">Guardar equipamiento</button>
      </form>

      {/* Visor */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Marcas del visor</h2>

        {sightMarks.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-3 px-4 py-2 bg-slate-50 dark:bg-slate-800">
              <span className="text-xs font-medium text-slate-500">Distancia</span>
              <span className="text-xs font-medium text-slate-500">Medida</span>
              <span className="text-xs font-medium text-slate-500">Notas</span>
            </div>
            {sightMarks.map((mark: any) => (
              <div key={mark.id} className="grid grid-cols-3 px-4 py-3 items-center">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{mark.distance_meters}m</span>
                <span className="text-sm text-slate-900 dark:text-white">{mark.mark}</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{mark.notes ?? '—'}</span>
                  <form action={deleteSightMark.bind(null, mark.id) as any}>
                    <button type="submit" className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <form action={saveSightMark as any} className="grid grid-cols-3 gap-2">
          <div>
            <label className="label text-xs">Distancia (m)</label>
            <input name="distance_meters" type="number" min={1} required className="input text-sm py-2" placeholder="18" />
          </div>
          <div>
            <label className="label text-xs">Medida</label>
            <input name="mark" type="text" required className="input text-sm py-2" placeholder="+3.5" />
          </div>
          <div>
            <label className="label text-xs">Notas</label>
            <input name="notes" type="text" className="input text-sm py-2" placeholder="Sala..." />
          </div>
          <button type="submit" className="col-span-3 btn-secondary justify-center text-sm">
            + Añadir marca
          </button>
        </form>
      </div>
    </div>
  )
}