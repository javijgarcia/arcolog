'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function uploadPhoto(
  file: File,
  sessionId: string | null,
  competitionId: string | null,
  caption: string = ''
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, file)

  if (uploadError) return { error: uploadError.message }

  const { error: dbError } = await supabase
    .from('session_photos')
    .insert({
      user_id: user.id,
      session_id: sessionId,
      competition_id: competitionId,
      storage_path: path,
      caption: caption || null,
    })

  if (dbError) return { error: dbError.message }

  if (sessionId) revalidatePath(`/training/${sessionId}`)
  if (competitionId) revalidatePath('/competitions/history')

  return { success: true }
}

export async function getPhotos(sessionId?: string, competitionId?: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('session_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (sessionId) query = query.eq('session_id', sessionId)
  if (competitionId) query = query.eq('competition_id', competitionId)

  const { data } = await query
  if (!data) return []

  return data.map(photo => ({
    ...photo,
    url: supabase.storage.from('photos').getPublicUrl(photo.storage_path).data.publicUrl,
  }))
}

export async function deletePhoto(id: string, storagePath: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'No autenticado' }

  await supabase.storage.from('photos').remove([storagePath])

  const { error } = await supabase
    .from('session_photos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}