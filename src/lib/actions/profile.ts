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

export async function getDashboardStats() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const [sessionsRes, competitionsRes, recentRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('id, total_arrows, session_date, feeling_score, session_ends(score)')
      .eq('user_id', user.id),
    supabase
      .from('competition_scores')
      .select('id, total_score, competition_date, competition_name')
      .eq('user_id', user.id)
      .order('competition_date', { ascending: false })
      .limit(5),
    supabase
      .from('training_sessions')
      .select('id, session_date, total_arrows, distance_meters, feeling_score')
      .eq('user_id', user.id)
      .gte('session_date', thirtyDaysAgoStr)
      .order('session_date', { ascending: false })
      .limit(5),
  ])

  const sessions = sessionsRes.data ?? []
  const competitions = competitionsRes.data ?? []
  const recentSessions = recentRes.data ?? []

  const totalArrows = sessions.reduce((sum, s) => sum + (s.total_arrows ?? 0), 0)
  const personalBest = competitions.length
    ? Math.max(...competitions.map(c => c.total_score))
    : null

  return {
    totalSessions: sessions.length,
    totalArrows,
    totalCompetitions: competitions.length,
    personalBest,
    recentSessions,
    recentCompetitions: competitions,
  }
}

export async function getProgressData(): Promise<ProgressDataPoint[]> {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const [trainRes, compRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('session_date, session_ends(score)')
      .eq('user_id', user.id)
      .order('session_date', { ascending: true })
      .limit(60),
    supabase
      .from('competition_scores')
      .select('competition_date, total_score, competition_name')
      .eq('user_id', user.id)
      .order('competition_date', { ascending: true }),
  ])

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
