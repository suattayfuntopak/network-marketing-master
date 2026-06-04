'use client'

import Link from 'next/link'
import { Zap, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export function PanoTodayCta() {
  const { t } = useTranslation()

  return (
    <Link
      href="/bugun/ilgilen"
      className="flex min-h-[3.25rem] items-center justify-between gap-3 rounded-2xl border border-[#534AB7]/30 bg-[#534AB7] px-4 py-3.5 text-white shadow-sm transition hover:bg-[#453DA0] active:scale-[0.99]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Zap className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm font-bold leading-tight">{t('dashboard.todayCtaTitle')}</p>
          <p className="text-xs text-white/80">{t('dashboard.todayCtaSubtitle')}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} />
    </Link>
  )
}
