'use client'

import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Users, UserPlus, BarChart3, GraduationCap, GitBranch,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export const EKIP_TAB_IDS = ['members', 'invite', 'activity', 'training', 'tree'] as const
export type EkipTabId = (typeof EKIP_TAB_IDS)[number]

const TABS: readonly {
  id: EkipTabId
  labelKey: string
  icon: LucideIcon
  activeClass: string
}[] = [
  { id: 'members', labelKey: 'team.tabMembers', icon: Users, activeClass: 'bg-[#534AB7] text-white shadow-md' },
  { id: 'invite', labelKey: 'team.tabInvite', icon: UserPlus, activeClass: 'bg-[#0F6E56] text-white shadow-md' },
  { id: 'activity', labelKey: 'team.tabActivity', icon: BarChart3, activeClass: 'bg-[#1A56DB] text-white shadow-md' },
  { id: 'training', labelKey: 'team.tabTraining', icon: GraduationCap, activeClass: 'bg-[#854F0B] text-white shadow-md' },
  { id: 'tree', labelKey: 'team.tabTree', icon: GitBranch, activeClass: 'bg-[#72243E] text-white shadow-md' },
]

export function isEkipTabId(value: string | null): value is EkipTabId {
  return !!value && EKIP_TAB_IDS.includes(value as EkipTabId)
}

type Props = {
  activeTab: EkipTabId
}

export function EkipTabNav({ activeTab }: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  function selectTab(id: EkipTabId) {
    router.replace(`/ekip?tab=${id}`, { scroll: false })
  }

  return (
    <nav
      className="no-swipe mb-6 flex w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-sm scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label={t('team.title')}
      data-no-swipe="true"
      onTouchStart={e => e.stopPropagation()}
    >
      {TABS.map(({ id, labelKey, icon: Icon, activeClass }) => {
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
  )
}
