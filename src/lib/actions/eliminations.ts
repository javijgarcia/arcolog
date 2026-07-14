'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Modality } from '@/types'

export async function createBracket(data: {
  title: string
  modality: Modality
  arrows_per_set: number
  sets_to_win: number
  participant_count: number
  group_id?: string | null
  participants: { display_name: string; user_id?: string | null }[]
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  // Crear el bracket
  const { data: bracket, error: bracketError } = await supabase
    .from('elimination_brackets')
    .insert({
      created_by: user.id,
      title: data.title,
      modality: data.modality,
      arrows_per_set: data.arrows_per_set,
      sets_to_win: data.sets_to_win,
      participant_count: data.participant_count,
      group_id: data.group_id ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (bracketError) return { error: bracketError.message }

  // Crear participantes con seed aleatorio
  const shuffled = [...data.participants].sort(() => Math.random() - 0.5)
  const { data: participants, error: participantsError } = await supabase
    .from('elimination_participants')
    .insert(shuffled.map((p, i) => ({
      bracket_id: bracket.id,
      display_name: p.display_name,
      user_id: p.user_id ?? null,
      seed: i + 1,
    })))
    .select()

  if (participantsError) return { error: participantsError.message }

  // Generar los enfrentamientos del cuadro
  const rounds = Math.log2(data.participant_count)
  const matches: any[] = []

  // Primera ronda — emparejar participantes
  const firstRoundMatches = data.participant_count / 2
  for (let i = 0; i < firstRoundMatches; i++) {
    matches.push({
      bracket_id: bracket.id,
      round: 1,
      position: i + 1,
      participant1_id: participants[i * 2].id,
      participant2_id: participants[i * 2 + 1].id,
      status: 'pending',
    })
  }

  // Rondas siguientes — vacías hasta que avancen los ganadores
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = data.participant_count / Math.pow(2, round)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        bracket_id: bracket.id,
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

  // Vincular next_match_id entre rondas
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
  return { success: true, bracketId: bracket.id, token: bracket.public_token }
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

  // Activar primera ronda
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
}) {
  const supabase = await createServerSupabaseClient()

  const total1 = data.arrow_scores1.reduce((sum, s) => sum + (s === 'X' ? 10 : s === 'M' ? 0 : parseInt(s) || 0), 0)
  const total2 = data.arrow_scores2.reduce((sum, s) => sum + (s === 'X' ? 10 : s === 'M' ? 0 : parseInt(s) || 0), 0)

  let points1 = 0
  let points2 = 0

  if (data.is_shootoff) {
    if (total1 > total2) { points1 = 1; points2 = 0 }
    else if (total2 > total1) { points1 = 0; points2 = 1 }
    else { points1 = 1; points2 = 0 } // Empate: gana quien tiene la flecha más cercana al centro — por defecto arquero 1
  } else {
    if (total1 > total2) { points1 = 2 }
    else if (total2 > total1) { points2 = 2 }
    else { points1 = 1; points2 = 1 }
  }

  // Guardar el set
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

  // Actualizar score acumulado del match
  const { data: match } = await supabase
    .from('elimination_matches')
    .select('*, elimination_sets(*)')
    .eq('id', data.match_id)
    .single()

  if (!match) return { error: 'Match no encontrado' }
  
  const { data: bracket } = await supabase
    .from('elimination_brackets')
    .select('sets_to_win')
    .eq('id', match.bracket_id)
    .single()

  const newScore1 = match.score1 + (data.is_shootoff ? 0 : points1)
  const newScore2 = match.score2 + (data.is_shootoff ? 0 : points2)
  
  // Verificar si hay ganador

const setsToWin = bracket?.sets_to_win ?? 3
  const maxPoints = setsToWin * 2
  console.log('setsToWin:', setsToWin, 'maxPoints:', maxPoints, 'newScore1:', newScore1, 'newScore2:', newScore2)

  let newStatus = match.status
  let winnerId = null

 if (data.is_shootoff) {
    // En shoot-off el ganador es quien tenga más puntos (total1 vs total2)
    if (total1 > total2) {
      winnerId = match.participant1_id
    } else {
      winnerId = match.participant2_id
    }
    newStatus = 'completed'
  } else if (newScore1 >= maxPoints) {
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

  // Si hay ganador, avanzarlo al siguiente match
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

  // Si era la final y hay ganador, completar el bracket
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