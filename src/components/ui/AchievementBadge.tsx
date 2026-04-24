import { ACHIEVEMENTS } from '@/types'
import type { Achievement } from '@/types'

interface Props {
  achievements: Achievement[]
  showAll?: boolean
}

export function AchievementBadge({ achievements, showAll = false }: Props) {
  const unlockedCodes = new Set(achievements.map(a => a.code))
  const allAchievements = Object.entries(ACHIEVEMENTS)
  const display = showAll ? allAchievements : allAchievements.filter(([code]) => unlockedCodes.has(code))

  if (display.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3">
      {display.map(([code, achievement]) => {
        const isUnlocked = unlockedCodes.has(code)
        const unlocked = achievements.find(a => a.code === code)
        return (
          <div
            key={code}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              isUnlocked
                ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-50'
            }`}
          >
            <span className="text-2xl">{achievement.emoji}</span>
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${
                isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {achievement.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {achievement.description}
              </p>
              {isUnlocked && unlocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {new Date(unlocked.unlocked_at).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}