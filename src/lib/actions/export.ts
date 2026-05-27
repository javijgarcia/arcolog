'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getExportData(type: 'personal' | 'group', groupId?: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, club_name, bow_type')
    .eq('id', user.id)
    .single()

  if (type === 'personal') {
    const [sessionsRes, competitionsRes] = await Promise.all([
      supabase
        .from('training_sessions')
        .select('*, session_ends(*)')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false }),
      supabase
        .from('competition_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('competition_date', { ascending: false }),
    ])

    return {
      profile,
      sessions: sessionsRes.data ?? [],
      competitions: competitionsRes.data ?? [],
      members: null,
    }
  }

  if (type === 'group' && groupId) {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, role, profiles(full_name, bow_type)')
      .eq('group_id', groupId)

    const memberIds = (members ?? []).map((m: any) => m.user_id)

    const [sessionsRes, competitionsRes] = await Promise.all([
      supabase
        .from('training_sessions')
        .select('*, session_ends(*)')
        .in('user_id', memberIds)
        .order('session_date', { ascending: false }),
      supabase
        .from('competition_scores')
        .select('*')
        .in('user_id', memberIds)
        .order('competition_date', { ascending: false }),
    ])

    return {
      profile,
      sessions: sessionsRes.data ?? [],
      competitions: competitionsRes.data ?? [],
      members: members ?? [],
    }
  }

  return null
}