'use client'

import { useMemo } from 'react'
import type { NmmCandidate } from '@/types/database.types'

// --- Algoritma sabitleri ---
const MAX_DAILY_CANDIDATES = 5
const STALE_DAYS = 3

// Kaç gün önce olduğunu hesaplar. null → Infinity (hiç temas yok)
function daysSince(isoDate: string | null): number {
  if (!isoDate) return Infinity
  const ms = Date.now() - new Date(isoDate).getTime()
  return ms / (1000 * 60 * 60 * 24)
}

// Aşama öncelik skoru: düşük = önce göster
const STAGE_PRIORITY: Record<NmmCandidate['stage'], number> = {
  takip:    0,
  sunum:    1,
  kararsiz: 2,
  iletisim: 3,
  yeni:     4,
  katildi:  9,
  kayboldu: 9,
}

export interface DailyCandidate extends NmmCandidate {
  daysSinceContact: number
}

export function useDailyActions(candidates: NmmCandidate[]): DailyCandidate[] {
  return useMemo(() => {
    const actionable = candidates
      .filter(c => c.stage !== 'katildi' && c.stage !== 'kayboldu')
      .map(c => ({ ...c, daysSinceContact: daysSince(c.last_contact_at) }))
      .filter(c => {
        // Takip Bekliyor veya 3+ gündür temas yok
        if (c.stage === 'takip') return true
        // Sunum yapıldı → 1 gün sonra listeye gir
        if (c.stage === 'sunum' && c.daysSinceContact >= 1) return true
        // Diğerleri: 3+ gün temas yok
        return c.daysSinceContact >= STALE_DAYS
      })
      .sort((a, b) => {
        const stageDiff = STAGE_PRIORITY[a.stage] - STAGE_PRIORITY[b.stage]
        if (stageDiff !== 0) return stageDiff
        return b.daysSinceContact - a.daysSinceContact // uzun süredir temas yok → önce
      })

    return actionable.slice(0, MAX_DAILY_CANDIDATES)
  }, [candidates])
}
