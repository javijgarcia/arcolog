'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Modality } from '@/types'

export async function createBracket(data: {
  title: string
  modality: Modality
  format_type: 'sets' | 'compuesto'
  arrows_per_set: number
  sets_to_win: number
  participant_count: number
  group_id?: string | null
  participants: { display_name: string; user_id?: string | null }[]
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { data: newBracket, error: bracketError } = await supabase
    .from('elimination_brackets')
    .insert({
      created_by: user.id,
      title: data.title,
      modality: data.modality,
      format_type: data.format_type,
      arrows_per_set: data.arrows_per_set,
      sets_to_win: data.sets_to_win,
      participant_count: data.participant_count,
      group_id: data.group_id ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (bracketError) return { error: bracketError.message }

  const shuffled = [...data.participants].sort(() => Math.random() - 0.5)
  const { data: participants, error: participantsError } = await supabase
    .from('elimination_participants')
    .insert(shuffled.map((p, i) => ({
      bracket_id: newBracket.id,
      display_name: p.display_name,
      user_id: p.user_id ?? null,
      seed: i + 1,
    })))
    .select()

  if (participantsError) return { error: participantsError.message }

  const rounds = Math.log2(data.participant_count)
  const matches: any[] = []

  const firstRoundMatches = data.participant_count / 2
  for (let i = 0; i < firstRoundMatches; i++) {
    matches.push({
      bracket_id: newBracket.id,
      round: 1,
      position: i + 1,
      participant1_id: participants[i * 2].id,
      participant2_id: participants[i * 2 + 1].id,
      status: 'pending',
    })
  }

  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = data.participant_count / Math.pow(2, round)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        bracket_id: newBracket.id,
        round,
        position: i + 1,
        participant1_id: null,
        participant2_id: null,
        status: 'pending',
      })
    }
  }

  const { data: createdMatches, error: matchesError } = await supabase
    .from('elimination_matches')
    .insert(matches)
    .select()

  if (matchesError) return { error: matchesError.message }

  for (let round = 1; round < rounds; round++) {
    const currentRoundMatches = createdMatches.filter(m => m.round === round)
    const nextRoundMatches = createdMatches.filter(m => m.round === round + 1)

    for (let i = 0; i < currentRoundMatches.length; i++) {
      const nextMatchIndex = Math.floor(i / 2)
      await supabase
        .from('elimination_matches')
        .update({ next_match_id: nextRoundMatches[nextMatchIndex].id })
        .eq('id', currentRoundMatches[i].id)
    }
  }

  revalidatePath('/eliminations')
  return { success: true, bracketId: newBracket.id, token: newBracket.public_token }
}

export async function getBrackets() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('elimination_brackets')
    .select('*, elimination_participants(*)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getBracket(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('elimination_brackets')
    .select('*, elimination_participants(*), elimination_matches(*, elimination_sets(*), participant1:elimination_participants!elimination_matches_participant1_id_fkey(*), participant2:elimination_participants!elimination_matches_participant2_id_fkey(*), winner:elimination_participants!elimination_matches_winner_id_fkey(*))')
    .eq('id', id)
    .single()

  return data
}

export async function getBracketByToken(token: string) {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('elimination_brackets')
    .select('*, elimination_participants(*), elimination_matches(*, elimination_sets(*), participant1:elimination_participants!elimination_matches_participant1_id_fkey(*), participant2:elimination_participants!elimination_matches_participant2_id_fkey(*), winner:elimination_participants!elimination_matches_winner_id_fkey(*))')
    .eq('public_token', token)
    .single()

  return data
}

export async function startBracket(bracketId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('elimination_brackets')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', bracketId)
    .eq('created_by', user.id)

  if (error) return { error: error.message }

  await supabase
    .from('elimination_matches')
    .update({ status: 'active' })
    .eq('bracket_id', bracketId)
    .eq('round', 1)

  revalidatePath(`/eliminations/${bracketId}`)
  return { success: true }
}

export async function submitSet(data: {
  match_id: string
  set_number: number
  arrow_scores1: string[]
  arrow_scores2: string[]
  is_shootoff?: boolean
  shootoff_winner?: '1' | '2' | null
}) {
  const supabase = await createServerSupabaseClient()

  const total1 = data.arrow_scores1.reduce((sum, s) => sum + (s === 'X' ? 10 : s === 'M' ? 0 : parseInt(s) || 0), 0)
  const total2 = data.arrow_scores2.reduce((sum, s) => sum + (s === 'X' ? 10 : s === 'M' ? 0 : parseInt(s) || 0), 0)

  let points1 = 0
  let points2 = 0

  if (data.is_shootoff) {
    if (total1 > total2) { points1 = 1; points2 = 0 }
    else if (total2 > total1) { points1 = 0; points2 = 1 }
    else if (data.shootoff_winner === '1') { points1 = 1; points2 = 0 }
    else if (data.shootoff_winner === '2') { points1 = 0; points2 = 1 }
  } else {
    if (total1 > total2) { points1 = 2 }
    else if (total2 > total1) { points2 = 2 }
    else { points1 = 1; points2 = 1 }
  }

  const { error: setError } = await supabase
    .from('elimination_sets')
    .insert({
      match_id: data.match_id,
      set_number: data.set_number,
      arrow_scores1: data.arrow_scores1,
      arrow_scores2: data.arrow_scores2,
      total1,
      total2,
      points1,
      points2,
      is_shootoff: data.is_shootoff ?? false,
    })

  if (setError) return { error: setError.message }

  const { data: match } = await supabase
    .from('elimination_matches')
    .select('*, elimination_sets(*)')
    .eq('id', data.match_id)
    .single()

  if (!match) return { error: 'Match no encontrado' }

  const { data: bracketData } = await supabase
    .from('elimination_brackets')
    .select('sets_to_win, format_type')
    .eq('id', match.bracket_id)
    .single()

  const formatType = bracketData?.format_type ?? 'sets'
  const setsToWin = bracketData?.sets_to_win ?? 3
  const maxPoints = setsToWin * 2

  let newStatus = match.status
  let winnerId = null

  if (data.is_shootoff) {
    if (points1 > points2) {
      winnerId = match.participant1_id
    } else if (points2 > points1) {
      winnerId = match.participant2_id
    }
    if (winnerId) newStatus = 'completed'

    await supabase
      .from('elimination_matches')
      .update({
        status: newStatus,
        winner_id: winnerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.match_id)

  } else if (formatType === 'compuesto') {
  // El SELECT ya incluye el set recién insertado, no hay que sumar total1/total2
    const allSetsComp = (match.elimination_sets ?? []).filter((s: any) => !s.is_shootoff)
    const totalSets = allSetsComp.length
    const accScore1 = allSetsComp.reduce((sum: number, s: any) => sum + (s.total1 ?? 0), 0)
    const accScore2 = allSetsComp.reduce((sum: number, s: any) => sum + (s.total2 ?? 0), 0)
	

    if (totalSets >= setsToWin) {
      if (accScore1 > accScore2) {
        winnerId = match.participant1_id
        newStatus = 'completed'
      } else if (accScore2 > accScore1) {
        winnerId = match.participant2_id
        newStatus = 'completed'
      } else {
        newStatus = 'shootoff'
      }
    }

    await supabase
      .from('elimination_matches')
      .update({
        score1: accScore1,
        score2: accScore2,
        status: newStatus,
        winner_id: winnerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.match_id)

  } else {
    const newScore1 = match.score1 + points1
    const newScore2 = match.score2 + points2

    if (newScore1 >= maxPoints) {
      winnerId = match.participant1_id
      newStatus = 'completed'
    } else if (newScore2 >= maxPoints) {
      winnerId = match.participant2_id
      newStatus = 'completed'
    } else if (newScore1 === (maxPoints - 1) && newScore2 === (maxPoints - 1)) {
      newStatus = 'shootoff'
    }

    await supabase
      .from('elimination_matches')
      .update({
        score1: newScore1,
        score2: newScore2,
        status: newStatus,
        winner_id: winnerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.match_id)
  }

  if (winnerId && match.next_match_id) {
    const { data: nextMatch } = await supabase
      .from('elimination_matches')
      .select('*')
      .eq('id', match.next_match_id)
      .single()

    if (nextMatch) {
      const isSlot1 = !nextMatch.participant1_id
      await supabase
        .from('elimination_matches')
        .update(isSlot1
          ? { participant1_id: winnerId, status: nextMatch.participant2_id ? 'active' : 'pending' }
          : { participant2_id: winnerId, status: nextMatch.participant1_id ? 'active' : 'pending' }
        )
        .eq('id', match.next_match_id)
    }
  }

  if (winnerId && !match.next_match_id) {
    await supabase
      .from('elimination_brackets')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', match.bracket_id)
  }

  revalidatePath(`/eliminations/${match.bracket_id}`)
  return { success: true, winnerId, newStatus }
}

export async function deleteBracket(bracketId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('elimination_brackets')
    .delete()
    .eq('id', bracketId)
    .eq('created_by', user.id)

  if (error) return { error: error.message }

  revalidatePath('/eliminations')
  return { success: true }
}
