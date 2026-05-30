'use client'

import { useMemo } from 'react'
import { buildDailyPriorities } from '@/lib/domain/dailyPriorities'
import { todayCalendarKey } from '@/lib/utils/calendarDates'
import type { NmmCandidate } from '@/types/database.types'

export type { DailyCandidate, DailyActionsResult } from '@/lib/domain/dailyPriorities'

export function useDailyActions(candidates: NmmCandidate[]) {
  const todayKey = useMemo(() => todayCalendarKey(), [])

  return useMemo(
    () => buildDailyPriorities(candidates, todayKey),
    [candidates, todayKey],
  )
}
