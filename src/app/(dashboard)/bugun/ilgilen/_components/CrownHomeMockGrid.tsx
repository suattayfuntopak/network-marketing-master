'use client'

import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'

const CROWN_ITEMS = [
  { id: 'daily', labelKey: 'dashboard.crownMockDailyFollow', href: '/bugunku-takibim' },
  { id: 'live', labelKey: 'dashboard.crownMockLiveTraining', href: '/canli-egitim' },
  { id: 'team', labelKey: 'nav.ekip', href: '/ekibim' },
  { id: 'weekly', labelKey: 'dashboard.crownMockWeeklySummary', href: '/haftalik-ozet' },
  { id: 'monthly', labelKey: 'dashboard.crownMockMonthlySummary', href: '/aylik-ozet' },
  { id: 'first30', labelKey: 'dashboard.crownMockFirst30Days', href: '/ilk-30-gun' },
] as const

export function IlgilenHubGrid() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <header className="space-y-4">
      <h1 className="text-xl font-bold text-[var(--text-1)]">
        {t('pagesUi.todayPrioritiesTitle')}
      </h1>
      <nav
        className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={t('pagesUi.todayPrioritiesTitle')}
      >
        {CROWN_ITEMS.map(({ id, labelKey, href }) => (
          <button
            key={id}
            type="button"
            onClick={() => router.push(href)}
            className={clsx(
              'shrink-0 rounded-lg px-3 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              'text-[var(--text-2)] hover:bg-[var(--bg-card)] hover:text-brand dark:hover:text-indigo-300 hover:shadow-sm hover:border hover:border-[var(--border)]'
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </nav>
    </header>
  )
}
