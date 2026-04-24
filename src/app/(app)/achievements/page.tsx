import { getAchievements, checkAndUnlockAchievements } from '@/lib/actions/achievements'
import { AchievementBadge } from '@/components/ui/AchievementBadge'
import { Trophy } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Logros' }

export default async function AchievementsPage() {
  await checkAndUnlockAchievements()
  const achievements = await getAchievements()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1>Mis logros</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {achievements.length} de 14 logros desbloqueados
        </p>
      </div>

      {achievements.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 mb-2">Todavía no has desbloqueado ningún logro.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Registra tu primera sesión para empezar.</p>
        </div>
      ) : (
        <div className="card p-6">
          <AchievementBadge achievements={achievements} showAll={true} />
        </div>
      )}
    </div>
  )
}