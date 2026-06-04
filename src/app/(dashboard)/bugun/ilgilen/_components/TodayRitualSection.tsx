'use client'

import { DayCloseCard } from '@/app/(dashboard)/pano/_components/DayCloseCard'
import { DayJournalCard } from './DayJournalCard'

/** Gün sonu kapanış + saha günlüğü (pano ile aynı localStorage anahtarları). */
export function TodayRitualSection() {
  return (
    <div className="space-y-4 border-t border-[var(--border)] pt-6">
      <DayCloseCard />
      <DayJournalCard />
    </div>
  )
}
