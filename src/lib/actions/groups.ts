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