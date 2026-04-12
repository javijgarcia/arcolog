'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CompetitionScoreForm } from '@/types'

export async function createCompetitionScore(data: CompetitionScoreForm) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('competition_scores')
    .insert({ ...data, user_id: user.id })

  if (error) return { error: error.message }

  revalidatePath('/competitions/history')
  revalidatePath('/dashboard')
  revalidatePath('/progress')
  redirect('/competitions/history')
}

export async function updateCompetitionScore(id: string, data: Partial<CompetitionScoreForm>) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('competition_scores')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/competitions/history')
  revalidatePath('/progress')
  redirect('/competitions/history')
}

export async function deleteCompetitionScore(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('competition_scores')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/competitions/history')
  revalidatePath('/progress')
  redirect('/competitions/history')
}

export async function getCompetitionScores() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('competition_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('competition_date', { ascending: false })

  if (error) return []
  return data
}
