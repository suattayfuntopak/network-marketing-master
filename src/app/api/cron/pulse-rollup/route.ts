import { NextRequest, NextResponse } from 'next/server'
import { cronAuthError } from '@/lib/infra/cronAuth'
import {
  defaultRollupDayKey,
  runDailyPulseRollup,
} from '@/lib/infra/pulseCronHelpers'

export async function GET(request: NextRequest) {
  const authError = cronAuthError(request)
  if (authError) return authError

  const dayParam = request.nextUrl.searchParams.get('day')
  const dayKey = dayParam?.match(/^\d{4}-\d{2}-\d{2}$/) ? dayParam : defaultRollupDayKey()

  try {
    const result = await runDailyPulseRollup(dayKey)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[pulse-rollup]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Rollup failed' },
      { status: 500 }
    )
  }
}
