'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CompetitionScoreForm } from '@/types'
import { checkAndUnlockAchievements } from '@/lib/actions/achievements'

export async function createCompetitionScore(data: CompetitionScoreForm) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

 const { ends, ends_json, use_control, series_count, diana_count, ...scoreData } = data
  console.log('use_control:', use_control, 'ends count:', ends?.length)

  const { data: competition, error } = await supabase
    .from('competition_scores')
    .insert({ ...scoreData, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

 const endsArray = ends_json ? JSON.parse(ends_json as string) : (ends ?? [])
  if (use_control && endsArray.length > 0) {
    await supabase.from('competition_ends').insert(
    endsArray.map((e: any) => ({
          competition_id: competition.id,
          end_number: e.end_number,
          arrows: e.arrows,
          score: e.score,
          arrow_scores: Array.isArray(e.arrow_scores) ? e.arrow_scores : [],
          impact_x: e.impacts ? e.impacts.map((i: any) => i.x) : null,
          impact_y: e.impacts ? e.impacts.map((i: any) => i.y) : null,
        }))
    )
  }

  await checkAndUnlockAchievements()

  revalidatePath('/competitions/history')
  revalidatePath('/dashboard')
  revalidatePath('/progress')
  return { success: true, competitionId: competition.id }
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
  return { success: true }
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
  revalidatePath(`/competitions/${id}`)
  return { success: true }
}
