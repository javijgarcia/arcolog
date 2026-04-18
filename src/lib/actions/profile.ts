'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile, ProgressDataPoint } from '@/types'

export async function getProfile() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data as Profile | null
}

export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }
  const updates = {
    full_name: formData.get('full_name') as string,
    bow_type: formData.get('bow_type') as string,
    club_name: formData.get('club_name') as string,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}

function getWeekRange(weeksAgo: number) {
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - dayOfWeek - weeksAgo * 7)
  startOfThisWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfThisWeek)
  endOfWeek.setDate(startOfThisWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  return {
    start: startOfThisWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0],
  }
}

function calculateStreak(sessions: { session_date: string }[]): number {
  if (sessions.length === 0) return 0
  const dates = [...new Set(sessions.map(s => s.session_date))].sort((a, b) => b.localeCompare(a))
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diff === 1) streak++
    else break
  }
  return streak
}

export async function getDashboardStats() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const thisWeek = getWeekRange(0)
  const lastWeek = getWeekRange(1)

  const [sessionsRes, competitionsRes, thisWeekRes, lastWeekRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('id, total_arrows, session_date, feeling_score, distance_meters')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false }),
    supabase
      .from('competition_scores')
      .select('id, total_score, competition_date, competition_name')
      .eq('user_id', user.id)
      .order('competition_date', { ascending: false })
      .limit(5),
    supabase
      .from('training_sessions')
      .select('id, total_arrows, session_date, session_ends(score)')
      .eq('user_id', user.id)
      .gte('session_date', thisWeek.start)
      .lte('session_date', thisWeek.end),
    supabase
      .from('training_sessions')
      .select('id, total_arrows, session_date, session_ends(score)')
      .eq('user_id', user.id)
      .gte('session_date', lastWeek.start)
      .lte('session_date', lastWeek.end),
  ])

  const sessions = sessionsRes.data ?? []
  const competitions = competitionsRes.data ?? []
  const thisWeekSessions = thisWeekRes.data ?? []
  const lastWeekSessions = lastWeekRes.data ?? []

  const totalArrows = sessions.reduce((sum, s) => sum + (s.total_arrows ?? 0), 0)
  const personalBest = competitions.length
    ? Math.max(...competitions.map(c => c.total_score))
    : null

  // Racha
  const streak = calculateStreak(sessions)

  // Esta semana vs semana anterior
  const thisWeekArrows = thisWeekSessions.reduce((s, sess) => s + (sess.total_arrows ?? 0), 0)
  const lastWeekArrows = lastWeekSessions.reduce((s, sess) => s + (sess.total_arrows ?? 0), 0)

  const thisWeekScore = thisWeekSessions.reduce((s, sess) => {
    const ends = sess.session_ends as {score:number}[] ?? []
    return s + ends.reduce((a, e) => a + e.score, 0)
  }, 0)
  const lastWeekScore = lastWeekSessions.reduce((s, sess) => {
    const ends = sess.session_ends as {score:number}[] ?? []
    return s + ends.reduce((a, e) => a + e.score, 0)
  }, 0)

  const arrowsDiff = thisWeekArrows - lastWeekArrows
  const scoreDiff = thisWeekScore - lastWeekScore

  // Mejor semana histórica
  const allWeekArrows = sessions.reduce((acc: Record<string, number>, s) => {
    const d = new Date(s.session_date)
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1
    const monday = new Date(d)
    monday.setDate(d.getDate() - day)
    const key = monday.toISOString().split('T')[0]
    acc[key] = (acc[key] ?? 0) + (s.total_arrows ?? 0)
    return acc
  }, {})
  const bestWeekArrows = Math.max(0, ...Object.values(allWeekArrows))

  return {
    totalSessions: sessions.length,
    totalArrows,
    totalCompetitions: competitions.length,
    personalBest,
    streak,
    recentSessions: sessions.slice(0, 5),
    recentCompetitions: competitions,
    thisWeek: {
      sessions: thisWeekSessions.length,
      arrows: thisWeekArrows,
      score: thisWeekScore,
    },
    lastWeek: {
      sessions: lastWeekSessions.length,
      arrows: lastWeekArrows,
      score: lastWeekScore,
    },
    arrowsDiff,
    scoreDiff,
    bestWeekArrows,
  }
}

export async function getProgressData(filter: 'semana' | 'mes' | 'año' | 'todo' = 'todo'): Promise<ProgressDataPoint[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let fromDate: string | null = null
  const now = new Date()
  if (filter === 'semana') {
    const d = new Date(now); d.setDate(d.getDate() - 7)
    fromDate = d.toISOString().split('T')[0]
  } else if (filter === 'mes') {
    const d = new Date(now); d.setMonth(d.getMonth() - 1)
    fromDate = d.toISOString().split('T')[0]
  } else if (filter === 'año') {
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1)
    fromDate = d.toISOString().split('T')[0]
  }

  let trainQuery = supabase
    .from('training_sessions')
    .select('session_date, session_ends(score)')
    .eq('user_id', user.id)
    .order('session_date', { ascending: true })

  let compQuery = supabase
    .from('competition_scores')
    .select('competition_date, total_score, competition_name')
    .eq('user_id', user.id)
    .order('competition_date', { ascending: true })

  if (fromDate) {
    trainQuery = trainQuery.gte('session_date', fromDate)
    compQuery = compQuery.gte('competition_date', fromDate)
  }

  const [trainRes, compRes] = await Promise.all([trainQuery, compQuery])

  const trainingPoints: ProgressDataPoint[] = (trainRes.data ?? [])
    .filter(s => s.session_ends && s.session_ends.length > 0)
    .map(s => ({
      date: s.session_date,
      score: (s.session_ends as {score:number}[]).reduce((sum, e) => sum + e.score, 0),
      type: 'training' as const,
      label: 'Entrenamiento',
    }))

  const competitionPoints: ProgressDataPoint[] = (compRes.data ?? []).map(c => ({
    date: c.competition_date,
    score: c.total_score,
    type: 'competition' as const,
    label: c.competition_name,
  }))

  return [...trainingPoints, ...competitionPoints].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}