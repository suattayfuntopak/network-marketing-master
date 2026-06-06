'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'

const CROWN_ITEMS: readonly {
  id: string
  labelKey: string
  href: string
  icon: LucideIcon
  activeClass: string
}[] = [
  { id: 'daily', labelKey: 'dashboard.crownMockDailyFollow', href: '/bugunku-takibim', icon: ClipboardList, activeClass: 'bg-[#534AB7] text-white shadow-md' },
  { id: 'live', labelKey: 'dashboard.crownMockLiveTraining', href: '/canli-egitim', icon: Video, activeClass: 'bg-[#1A56DB] text-white shadow-md' },
  { id: 'team', labelKey: 'nav.ekip', href: '/ekibim', icon: Users, activeClass: 'bg-amber-600 text-white shadow-md' },
  { id: 'weekly', labelKey: 'dashboard.crownMockWeeklySummary', href: '/haftalik-ozet', icon: BarChart3, activeClass: 'bg-[#0F6E56] text-white shadow-md' },
  { id: 'monthly', labelKey: 'dashboard.crownMockMonthlySummary', href: '/aylik-ozet', icon: CalendarRange, activeClass: 'bg-[#72243E] text-white shadow-md' },
  { id: 'first30', labelKey: 'dashboard.crownMockFirst30Days', href: '/ilk-30-gun', icon: CalendarDays, activeClass: 'bg-[#C03E1F] text-white shadow-md' },
]

export function IlgilenHubGrid() {
  const { t } = useTranslation()
  const router = useRouter()
  const [activeId, setActiveId] = useState(CROWN_ITEMS[0].id)

  function selectTab(id: string, href: string) {
    setActiveId(id)
    router.push(href)
  }

  return (
    <header className="space-y-4">
      <h1 className="text-xl font-bold text-[var(--text-1)]">
        {t('pagesUi.todayPrioritiesTitle')}
      </h1>
      <nav
        className="no-swipe flex w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-sm scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t('pagesUi.todayPrioritiesTitle')}
        data-no-swipe="true"
        onTouchStart={e => e.stopPropagation()}
      >
        {CROWN_ITEMS.map(({ id, labelKey, href, icon: Icon, activeClass }) => {
          const isActive = activeId === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(id, href)}
              className={clsx(
                'flex min-w-[4.5rem] flex-1 shrink-0 items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition-all duration-200 active:scale-[0.98] sm:gap-2 sm:text-sm',
                isActive ? activeClass : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t(labelKey)}</span>
            </button>
          )
        })}
      </nav>
    </header>
  )
}
