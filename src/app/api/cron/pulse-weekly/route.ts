import { NextRequest, NextResponse } from 'next/server'
import { cronAuthError } from '@/lib/infra/cronAuth'
import {
  defaultWeeklyWeekStart,
  runWeeklyPulseAi,
} from '@/lib/infra/pulseCronHelpers'
import { previousWeekStartKey } from '@/lib/domain/pulseRollup'
import { todayCalendarKey } from '@/lib/utils/calendarDates'

export async function GET(request: NextRequest) {
  const authError = cronAuthError(request)
  if (authError) return authError

  const weekParam = request.nextUrl.searchParams.get('week_start')
  const weekStart =
    weekParam?.match(/^\d{4}-\d{2}-\d{2}$/)
      ? weekParam
      : defaultWeeklyWeekStart()

  try {
    const result = await runWeeklyPulseAi(weekStart)
    return NextResponse.json({
      ok: true,
      ...result,
      hint: `Schedule weekly; optional ?week_start=${previousWeekStartKey(todayCalendarKey())}`,
    })
  } catch (err) {
    console.error('[pulse-weekly]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Weekly pulse AI failed' },
      { status: 500 }
    )
  }
}
