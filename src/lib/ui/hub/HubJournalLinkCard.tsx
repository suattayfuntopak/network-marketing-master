'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export function HubJournalLinkCard() {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEEDFE] dark:bg-[#2d2a5e]">
          <BookOpen className="h-4 w-4 text-[#534AB7] dark:text-[#a09be8]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-1)]">{t('dashboard.dailyJournalTeaserTitle')}</p>
          <p className="mt-0.5 text-xs text-[var(--text-3)]">{t('dashboard.dailyJournalTeaserBody')}</p>
          <Link
            href="/pano#journal"
            className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
          >
            {t('dashboard.dailyJournalTeaserCta')} →
          </Link>
        </div>
      </div>
    </div>
  )
}
