'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getEquipment() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('equipment')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}

export async function saveEquipment(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const updates = {
    user_id: user.id,
    marca_cuerpo: formData.get('marca_cuerpo') as string || null,
    marca_palas: formData.get('marca_palas') as string || null,
    libras_nominales: formData.get('libras_nominales') ? Number(formData.get('libras_nominales')) : null,
    libras_reales: formData.get('libras_reales') ? Number(formData.get('libras_reales')) : null,
    longitud_flecha: formData.get('longitud_flecha') ? Number(formData.get('longitud_flecha')) : null,
    tubos: formData.get('tubos') as string || null,
    tipo_plumas: formData.get('tipo_plumas') as string || null,
    spine: formData.get('spine') as string || null,
    apertura: formData.get('apertura') as string || null,
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await supabase
    .from('equipment')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('equipment')
      .insert(updates)
    if (error) return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function getSightMarks() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('sight_marks')
    .select('*')
    .eq('user_id', user.id)
    .order('distance_meters', { ascending: true })

  return data ?? []
}

export async function saveSightMark(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('sight_marks')
    .insert({
      user_id: user.id,
      distance_meters: Number(formData.get('distance_meters')),
      mark: formData.get('mark') as string,
      notes: formData.get('notes') as string || null,
    })

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function deleteSightMark(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('sight_marks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}