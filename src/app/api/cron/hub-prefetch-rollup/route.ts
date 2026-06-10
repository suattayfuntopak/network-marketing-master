import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cronAuthError } from '@/lib/infra/cronAuth'

/** UTC dün — hub prefetch günlük rollup. */
function yesterdayUtcDateKey(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const authError = cronAuthError(request)
  if (authError) return authError

  const day = yesterdayUtcDateKey()
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('nmm_rollup_hub_prefetch_daily', { p_day: day })

  if (error) {
    console.error('[hub-prefetch-rollup]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ day, workspacesUpserted: data ?? 0 })
}
