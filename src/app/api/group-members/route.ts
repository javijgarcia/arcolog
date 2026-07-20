import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('group_id')
  if (!groupId) return NextResponse.json([])

  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('group_members')
    .select('user_id, profiles(full_name)')
    .eq('group_id', groupId)

  const members = (data ?? []).map((m: any) => ({
    user_id: m.user_id,
    display_name: m.profiles?.full_name ?? 'Arquero',
  }))

  return NextResponse.json(members)
}