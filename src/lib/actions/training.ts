'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { TrainingSessionForm } from '@/types'

export async function createTrainingSession(data: TrainingSessionForm) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { ends, ...sessionData } = data

  // Insert session
  const { data: session, error: sessionError } = await supabase
    .from('training_sessions')
    .insert({
      ...sessionData,
      user_id: user.id,
      total_arrows: ends.reduce((sum, e) => sum + e.arrows, 0),
    })
    .select()
    .single()

  if (sessionError) return { error: sessionError.message }

  // Insert all ends
  if (ends.length > 0) {
    const { error: endsError } = await supabase
      .from('session_ends')
      .insert(ends.map(e => ({ ...e, session_id: session.id })))

    if (endsError) return { error: endsError.message }
  }

  revalidatePath('/training/history')
  revalidatePath('/dashboard')
  redirect('/training/history')
}

export async function updateTrainingSession(id: string, data: Partial<TrainingSessionForm>) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { ends, ...sessionData } = data

  const { error } = await supabase
    .from('training_sessions')
    .update({ ...sessionData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  if (ends) {
    await supabase.from('session_ends').delete().eq('session_id', id)
    if (ends.length > 0) {
      await supabase.from('session_ends').insert(
        ends.map(e => ({ ...e, session_id: id }))
      )
    }
  }

  revalidatePath('/training/history')
  revalidatePath(`/training/${id}`)
  revalidatePath('/dashboard')
  redirect(`/training/${id}`)
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
