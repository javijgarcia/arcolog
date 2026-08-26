import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('profiles')
    .select('country')
    .not('country', 'is', null)
    .neq('country', '')

  if (!data) return NextResponse.json([])

  const countryCounts: Record<string, number> = {}
  for (const profile of data) {
    if (profile.country) {
      countryCounts[profile.country] = (countryCounts[profile.country] ?? 0) + 1
    }
  }

  const result = Object.entries(countryCounts).map(([country, count]) => ({
    country,
    count,
  }))

  return NextResponse.json(result)
}