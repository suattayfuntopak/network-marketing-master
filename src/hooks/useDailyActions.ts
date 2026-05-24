'use client'

import { useMemo } from 'react'
import type { NmmCandidate } from '@/types/database.types'

const MAX_DAILY_CANDIDATES = 5
const STALE_DAYS = 3

function daysSince(isoDate: string | null): number {
  if (!isoDate) return Infinity
  const ms = Date.now() - new Date(isoDate).getTime()
  return ms / (1000 * 60 * 60 * 24)
}

const STAGE_PRIORITY: Record<NmmCandidate['stage'], number> = {
  takip:       0,
  davetli:     1,
  sunum:       2,
  kararsiz:    3,
  iletisim:    4,
  yeni:        5,
  katildi:     9,
  ilgilenmedi: 9,
  kayboldu:    9,
}

export interface DailyCandidate extends NmmCandidate {
  daysSinceContact: number
}

export interface DailyActionsResult {
  daily: DailyCandidate[]
  remaining: number
  all: DailyCandidate[]
}

export function useDailyActions(candidates: NmmCandidate[]): DailyActionsResult {
  return useMemo(() => {
    const actionable = candidates
      .filter(c => c.stage !== 'katildi' && c.stage !== 'ilgilenmedi' && c.stage !== 'kayboldu')
      .map(c => ({ ...c, daysSinceContact: daysSince(c.last_contact_at) }))
      .filter(c => {
        if (c.stage === 'takip') return true
        if (c.stage === 'sunum' && c.daysSinceContact >= 1) return true
        if (c.stage === 'davetli' && c.daysSinceContact >= 1) return true
        return c.daysSinceContact >= STALE_DAYS
      })
      .sort((a, b) => {
        const stageDiff = STAGE_PRIORITY[a.stage] - STAGE_PRIORITY[b.stage]
        if (stageDiff !== 0) return stageDiff
        return b.daysSinceContact - a.daysSinceContact
      })

    return {
      daily: actionable.slice(0, MAX_DAILY_CANDIDATES),
      remaining: Math.max(0, actionable.length - MAX_DAILY_CANDIDATES),
      all: actionable,
    }
  }, [candidates])
}
