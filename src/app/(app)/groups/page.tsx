import { getMyGroups } from '@/lib/actions/groups'
import { createGroup, joinGroup } from '@/lib/actions/groups'
import { Users, Plus, LogIn } from 'lucide-react'
import type { Metadata } from 'next'
import { CreateGroupForm } from './CreateGroupForm'
import { JoinGroupForm } from './JoinGroupForm'

export const metadata: Metadata = { title: 'Grupos' }

export default async function GroupsPage() {
  const myGroups = await getMyGroups()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1>Grupos</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Gestiona tus grupos de entrenamiento
        </p>
      </div>

      {myGroups.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Mis grupos</h2>
          <div className="space-y-2">
            {myGroups.map((m: any) => (
              <a
                key={m.id}
                href={`/groups/${m.groups.id}`}
                className="card flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">{m.groups.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {m.role === 'entrenador' ? '🧑‍🏫 Entrenador' : '🏹 Arquero'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> Crear grupo
        </h2>
        <CreateGroupForm />      
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <LogIn className="w-4 h-4" /> Unirse a un grupo
        </h2>
        <JoinGroupForm />
      </section>
    </div>
  )
}
