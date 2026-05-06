'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function createScheduledTraining(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const groupId = formData.get('group_id') as string

  const { data: training, error } = await supabase
    .from('scheduled_trainings')
    .insert({
      group_id: groupId,
      created_by: user.id,
      scheduled_date: formData.get('scheduled_date') as string,
      modality: formData.get('modality') as string || null,
      distance_meters: formData.get('distance_meters') ? Number(formData.get('distance_meters')) : null,
      objective: formData.get('objective') as string || null,
      notes: formData.get('notes') as string || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Crear entradas pendientes para todos los arqueros del grupo
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('role', 'arquero')

  if (members && members.length > 0) {
    await supabase.from('scheduled_training_completions').insert(
      members.map(m => ({
        scheduled_training_id: training.id,
        user_id: m.user_id,
        status: 'pendiente',
      }))
    )
  }

  revalidatePath(`/groups/${groupId}`)
  return { success: true, trainingId: training.id }
}

export async function deleteScheduledTraining(id: string, groupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('scheduled_trainings')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/groups/${groupId}`)
  return { success: true }
}

export async function getScheduledTrainings(groupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('scheduled_trainings')
    .select('*, scheduled_training_completions(*, profiles(*))')
    .eq('group_id', groupId)
    .order('scheduled_date', { ascending: true })

  return data ?? []
}

export async function getMyPendingTrainings() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('scheduled_training_completions')
    .select('*, scheduled_trainings(*)')
    .eq('user_id', user.id)
    .eq('status', 'pendiente')

  if (!data) return []

  return data.filter((c: any) =>
    c.scheduled_trainings &&
    c.scheduled_trainings.scheduled_date <= today
  )
}

export async function getMyUpcomingTrainings() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('scheduled_training_completions')
    .select('*, scheduled_trainings(*)')
    .eq('user_id', user.id)
    .eq('status', 'pendiente')

  if (!data) return []

  return data.filter((c: any) =>
    c.scheduled_trainings &&
    c.scheduled_trainings.scheduled_date >= today
  ).slice(0, 5)
}

export async function updateCompletionStatus(
  completionId: string,
  status: 'completado' | 'descartado',
  sessionId?: string
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('scheduled_training_completions')
    .update({
      status,
      session_id: sessionId ?? null,
      completed_at: status === 'completado' ? new Date().toISOString() : null,
    })
    .eq('id', completionId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}