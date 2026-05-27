'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkAndUnlockAchievements } from '@/lib/actions/achievements'
import type { TrainingSessionForm } from '@/types'

export async function createTrainingSession(data: TrainingSessionForm) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { ends, extra_arrows, ...sessionData } = data

  const { data: session, error: sessionError } = await supabase
    .from('training_sessions')
   .insert({
      ...sessionData,
      user_id: user.id,
      total_arrows: ends.reduce((sum, e) => sum + e.arrows, 0) + (extra_arrows ?? 0),
      mental_concentration: sessionData.mental_concentration || null,
      mental_activation: sessionData.mental_activation || null,
      mental_nerves: sessionData.mental_nerves || null,
      mental_notes: sessionData.mental_notes || null,
    })
    .select()
    .single()

  if (sessionError) return { error: sessionError.message }

  if (ends.length > 0) {
    const { error: endsError } = await supabase
      .from('session_ends')
      .insert(ends.map(e => ({
        session_id: session.id,
        end_number: e.end_number,
        arrows: e.arrows,
        score: e.score,
        arrow_scores: e.arrow_scores,
      })))

    if (endsError) return { error: endsError.message }
  }

  await checkAndUnlockAchievements()

  revalidatePath('/training/history')
  revalidatePath('/dashboard')
  redirect('/training/history')
}

export async function deleteTrainingSession(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/training/history')
  revalidatePath('/dashboard')
  redirect('/training/history')
}

export async function getTrainingSessions() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('training_sessions')
    .select('*, session_ends(*)')
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })

  if (error) return []
  return data
}

export async function getTrainingSession(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('training_sessions')
    .select('*, session_ends(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

export async function getLastSession() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('session_date', { ascending: false })
    .limit(1)
    .single()

  return data
}

export async function updateTrainingSessionBasic(
  id: string,
  data: {
    session_date: string
    distance_meters: number
    objective: string
    feeling_score: number
    weather: string
    notes: string
  }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('training_sessions')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/training/${id}`)
  revalidatePath('/training/history')
  return { success: true }
}
