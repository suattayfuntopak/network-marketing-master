'use client'

import { DayCloseCard } from './DayCloseCard'
import { DayJournalCard } from '@/app/(dashboard)/bugun/ilgilen/_components/DayJournalCard'

/** Gün sonu özeti + saha günlüğü — Günlük Özet sayfasından ayrı tutulur. */
export function PanoDayRitualSection() {
  return (
    <section id="gunluk-not" className="scroll-mt-28 space-y-4 border-t border-[var(--border)] pt-4 md:pt-5">
      <DayCloseCard />
      <DayJournalCard />
    </section>
  )
}
