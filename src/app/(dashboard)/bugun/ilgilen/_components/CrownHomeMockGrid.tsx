'use client'

import { useRouter } from 'next/navigation'
import {
  Activity,
  BarChart3,
  CalendarRange,
  ClipboardList,
  Map,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'

export const ILGILEN_TAB_IDS = ['roadmap', 'daily', 'weekly', 'monthly', 'saharadar', 'live'] as const
export type IlgilenTabId = (typeof ILGILEN_TAB_IDS)[number]

const CROWN_ITEMS: readonly {
  id: IlgilenTabId
  labelKey: string
  icon: LucideIcon
  activeClass: string
}[] = [
  { id: 'roadmap',    labelKey: 'dashboard.panoActionPlan',          icon: Map,          activeClass: 'bg-[#3730A3] text-white shadow-md' },
  { id: 'daily',      labelKey: 'dashboard.panoDailyWhatIDid',       icon: ClipboardList, activeClass: 'bg-[#534AB7] text-white shadow-md' },
  { id: 'weekly',     labelKey: 'dashboard.crownMockWeeklySummary',  icon: BarChart3,     activeClass: 'bg-[#0F6E56] text-white shadow-md' },
  { id: 'monthly',    labelKey: 'dashboard.crownMockMonthlySummary', icon: CalendarRange, activeClass: 'bg-[#72243E] text-white shadow-md' },
  { id: 'saharadar',  labelKey: 'dashboard.crownMockSahaRadar',      icon: Activity,      activeClass: 'bg-[#C03E1F] text-white shadow-md' },
  { id: 'live',       labelKey: 'dashboard.crownMockLiveTraining',   icon: Video,         activeClass: 'bg-[#1A56DB] text-white shadow-md' },
]

type Props = {
  activeTab: IlgilenTabId
}

export function IlgilenHubGrid({ activeTab }: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  function selectTab(id: IlgilenTabId) {
    if (id === 'daily') {
      router.push('/bugunku-takibim')
      return
    }
    if (id === 'saharadar') {
      router.push('/saha-radar')
      return
    }
    router.replace(`/bugun/ilgilen?tab=${id}`, { scroll: false })
  }

  const activeItem = CROWN_ITEMS.find(item => item.id === activeTab) ?? CROWN_ITEMS[0]

  return (
    <header className="space-y-4">
      <h1 className="text-xl font-bold text-[var(--text-1)]">{t(activeItem.labelKey)}</h1>
      <nav
        className="no-swipe flex w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-sm scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label={t(activeItem.labelKey)}
        data-no-swipe="true"
        onTouchStart={e => e.stopPropagation()}
      >
        {CROWN_ITEMS.map(({ id, labelKey, icon: Icon, activeClass }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(id)}
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
