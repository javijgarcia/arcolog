'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getMyGroups() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('group_members')
    .select('*, groups(*)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  return data ?? []
}

export async function getOwnedGroups() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('groups')
    .select('*, group_members(*, profiles(*))')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function createGroup(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description: description || null, owner_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'entrenador',
  })

  revalidatePath('/groups')
  return { success: true, groupId: group.id }
}

export async function joinGroup(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const invite_code = (formData.get('invite_code') as string).toUpperCase().trim()

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', invite_code)
    .single()

  if (groupError || !group) return { error: 'Código de invitación no válido' }

  const { error } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'arquero',
  })

  if (error) {
    if (error.code === '23505') return { error: 'Ya eres miembro de este grupo' }
    return { error: error.message }
  }

  revalidatePath('/groups')
  return { success: true, groupId: group.id }
}

export async function leaveGroup(groupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/groups')
  return { success: true }
}

export async function deleteGroup(groupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)
    .eq('owner_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/groups')
  return { success: true }
}

export async function getGroupDetail(groupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('groups')
    .select('*, group_members(*, profiles(*))')
    .eq('id', groupId)
    .single()

  return data
}

export async function getMemberStats(userId: string) {
  const supabase = await createServerSupabaseClient()

  const [sessionsRes, competitionsRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('id, total_arrows, session_date, session_ends(score, arrows)')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(20),
    supabase
      .from('competition_scores')
      .select('id, total_score, competition_date')
      .eq('user_id', userId)
      .order('competition_date', { ascending: false }),
  ])

  const sessions = sessionsRes.data ?? []
  const competitions = competitionsRes.data ?? []

  const totalArrows = sessions.reduce((s, sess) => s + (sess.total_arrows ?? 0), 0)
  const personalBest = competitions.length
    ? Math.max(...competitions.map(c => c.total_score))
    : null

  const recentScores = sessions
    .filter(s => s.session_ends && s.session_ends.length > 0)
    .slice(0, 5)
    .map(s => ({
      date: s.session_date,
      score: (s.session_ends as {score:number}[]).reduce((sum, e) => sum + e.score, 0),
    }))

  return {
    totalSessions: sessions.length,
    totalArrows,
    personalBest,
    recentScores,
    lastSession: sessions[0]?.session_date ?? null,
  }
}

export async function removeMember(groupId: string, userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { data: myMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!myMembership || myMembership.role !== 'entrenador') return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function promoteMember(groupId: string, userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { data: myMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!myMembership || myMembership.role !== 'entrenador') return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('group_members')
    .update({ role: 'entrenador' })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function demoteMember(groupId: string, userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { data: myMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!myMembership || myMembership.role !== 'entrenador') return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('group_members')
    .update({ role: 'arquero' })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}
export async function getGroupActivity(groupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { scheduled: [], activity: [] }

  const [scheduledRes, activityRes] = await Promise.all([
    supabase
      .from('scheduled_trainings')
      .select('scheduled_date, id, modality, objective')
      .eq('group_id', groupId)
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('training_sessions')
      .select('session_date, user_id, total_arrows, profiles(full_name)')
      .in('user_id',
        (await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
        ).data?.map((m: any) => m.user_id) ?? []
      )
      .order('session_date', { ascending: true }),
  ])

  return {
    scheduled: scheduledRes.data ?? [],
      activity: activityRes.data ?? [],
  }
}

  export async function getGroupRanking(groupId: string, period: 'semana' | 'mes' | 'año') {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const now = new Date()
  let fromDate: string

  if (period === 'semana') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    fromDate = d.toISOString().split('T')[0]
  } else if (period === 'mes') {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    fromDate = d.toISOString().split('T')[0]
  } else {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() - 1)
    fromDate = d.toISOString().split('T')[0]
  }

  // Obtener miembros del grupo
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, role, profiles(full_name, bow_type)')
    .eq('group_id', groupId)

  if (!members) return []

  // Obtener sesiones de cada miembro en el periodo
  const memberIds = members.map((m: any) => m.user_id)

  const [sessionsRes, competitionsRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('user_id, total_arrows, session_date, session_ends(score)')
      .in('user_id', memberIds)
      .gte('session_date', fromDate),
    supabase
      .from('competition_scores')
      .select('user_id, total_score, competition_date')
      .in('user_id', memberIds)
      .gte('competition_date', fromDate),
  ])

  const sessions = sessionsRes.data ?? []
  const competitions = competitionsRes.data ?? []

  return members.map((m: any) => {
    const memberSessions = sessions.filter(s => s.user_id === m.user_id)
    const memberCompetitions = competitions.filter(c => c.user_id === m.user_id)

    const totalArrows = memberSessions.reduce((sum, s) => sum + (s.total_arrows ?? 0), 0)
    const totalSessions = memberSessions.length

    const scores = memberSessions
      .filter(s => s.session_ends && s.session_ends.length > 0)
      .map(s => (s.session_ends as {score:number}[]).reduce((sum, e) => sum + e.score, 0))

    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    const personalBest = memberCompetitions.length
      ? Math.max(...memberCompetitions.map(c => c.total_score))
      : 0

    // Calcular racha
    const dates = [...new Set(memberSessions.map(s => s.session_date))].sort((a, b) => b.localeCompare(a))
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

    return {
      user_id: m.user_id,
      full_name: (m.profiles as any)?.full_name ?? 'Arquero',
      bow_type: (m.profiles as any)?.bow_type ?? null,
      role: m.role,
      totalArrows,
      totalSessions,
      avgScore,
      personalBest,
      streak,
    }
  })
}
export async function getGroupProgressComparison(groupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, profiles(full_name)')
    .eq('group_id', groupId)
    .in('role', ['arquero', 'entrenador'])

  if (!members) return []

  const memberIds = members.map((m: any) => m.user_id)

 const [sessionsRes, competitionsRes] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('user_id, session_date, total_arrows, session_ends(score)')
      .in('user_id', memberIds)
      .order('session_date', { ascending: true })
      .limit(200),
    supabase
      .from('competition_scores')
      .select('user_id, competition_date, total_score')
      .in('user_id', memberIds)
      .order('competition_date', { ascending: true }),
  ])

  const sessions = sessionsRes.data ?? []
  const competitions = competitionsRes.data ?? []

  return members.map((m: any) => {
    const memberSessions = sessions
      .filter(s => s.user_id === m.user_id)
      .map(s => {
        const endsScore = s.session_ends && s.session_ends.length > 0
          ? (s.session_ends as {score:number}[]).reduce((sum, e) => sum + e.score, 0)
          : null
        return {
          date: s.session_date,
          score: endsScore,
        }
      })
      .filter(s => s.score !== null && s.score > 0)

    const memberCompetitions = competitions
      .filter(c => c.user_id === m.user_id)
      .map(c => ({
        date: c.competition_date,
        score: c.total_score,
      }))

    const allPoints = [...memberSessions, ...memberCompetitions]
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      user_id: m.user_id,
      full_name: (m.profiles as any)?.full_name ?? 'Arquero',
      sessions: allPoints,
    }
  })
}