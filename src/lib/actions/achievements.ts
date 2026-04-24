'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ACHIEVEMENTS } from '@/types'

export async function getAchievements() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false })

  return data ?? []
}

export async function checkAndUnlockAchievements() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Obtener datos del usuario
  const [sessionsRes, competitionsRes, achievementsRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('id, total_arrows, session_date, session_ends(score, arrows)')
      .eq('user_id', user.id),
    supabase
      .from('competition_scores')
      .select('id, total_score')
      .eq('user_id', user.id),
    supabase
      .from('achievements')
      .select('code')
      .eq('user_id', user.id),
  ])

  const sessions = sessionsRes.data ?? []
  const competitions = competitionsRes.data ?? []
  const unlocked = new Set((achievementsRes.data ?? []).map(a => a.code))

  const totalArrows = sessions.reduce((s, sess) => s + (sess.total_arrows ?? 0), 0)
  const totalSessions = sessions.length
  const totalCompetitions = competitions.length

  // Calcular racha
  const dates = [...new Set(sessions.map(s => s.session_date))].sort((a, b) => b.localeCompare(a))
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dates[0] === today || dates[0] === yesterday) {
    streak = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
      if (diff === 1) streak++
      else break
    }
  }

  // Calcular mejor efectividad
  let bestEfficiency = 0
  for (const sess of sessions) {
    const ends = sess.session_ends as { score: number; arrows: number }[] ?? []
    const totalScore = ends.reduce((s, e) => s + e.score, 0)
    const totalArrowsSession = ends.reduce((s, e) => s + e.arrows, 0)
    if (totalArrowsSession > 0) {
      const maxPossible = totalArrowsSession * 10
      const efficiency = (totalScore / maxPossible) * 100
      if (efficiency > bestEfficiency) bestEfficiency = efficiency
    }
  }

  // Personal best en competición
  const personalBest = competitions.length
    ? Math.max(...competitions.map(c => c.total_score))
    : 0

  // Comprobar qué logros hay que desbloquear
  const toUnlock: string[] = []

  const checks: Record<string, boolean> = {
    first_session: totalSessions >= 1,
    first_competition: totalCompetitions >= 1,
    arrows_100: totalArrows >= 100,
    arrows_500: totalArrows >= 500,
    arrows_1000: totalArrows >= 1000,
    arrows_5000: totalArrows >= 5000,
    streak_7: streak >= 7,
    streak_30: streak >= 30,
    sessions_10: totalSessions >= 10,
    sessions_25: totalSessions >= 25,
    sessions_50: totalSessions >= 50,
    personal_best: personalBest > 0,
    efficiency_80: bestEfficiency >= 80,
    efficiency_90: bestEfficiency >= 90,
  }

  for (const [code, condition] of Object.entries(checks)) {
    if (condition && !unlocked.has(code)) {
      toUnlock.push(code)
    }
  }

  if (toUnlock.length > 0) {
    await supabase.from('achievements').insert(
      toUnlock.map(code => ({ user_id: user.id, code }))
    )
  }

  return toUnlock
}