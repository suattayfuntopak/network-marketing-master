'use client'

import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  prefetchEkipRankingMetrics,
  prefetchEkipTrainingMetrics,
} from '@/lib/query/prefetchRouteMetrics'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { HorizontalScrollLock } from '@/components/ui/HorizontalScrollLock'
import { clsx } from 'clsx'
import {
  Users, BarChart3, GraduationCap, GitBranch,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  EKIP_MODULE_ACCENT_CLASS,
  PANO_INDIGO_GRADIENT_ACTIVE,
  PANO_TEAL_GRADIENT_ACTIVE,
} from '@/lib/ui/brandGradients'

export const EKIP_TAB_IDS = ['members', 'summary', 'training', 'tree'] as const
export type EkipTabId = (typeof EKIP_TAB_IDS)[number]

const LEGACY_TAB_MAP: Record<string, EkipTabId> = {
  activity: 'summary',
  invite: 'members',
  tools: 'members',
}

const TABS: readonly {
  id: EkipTabId
  labelKey: string
  icon: LucideIcon
  activeClass: string
}[] = [
  {
    id: 'members',
    labelKey: 'team.tabMembers',
    icon: Users,
    activeClass: EKIP_MODULE_ACCENT_CLASS,
  },
  { id: 'summary', labelKey: 'team.tabSummary', icon: BarChart3, activeClass: 'bg-[#1A56DB] text-white shadow-md' },
  { id: 'training', labelKey: 'team.tabTraining', icon: GraduationCap, activeClass: PANO_TEAL_GRADIENT_ACTIVE },
  { id: 'tree', labelKey: 'team.tabTree', icon: GitBranch, activeClass: PANO_INDIGO_GRADIENT_ACTIVE },
]

export function isEkipTabId(value: string | null): value is EkipTabId {
  return !!value && EKIP_TAB_IDS.includes(value as EkipTabId)
}

export function resolveEkipTab(raw: string | null): EkipTabId {
  if (raw && LEGACY_TAB_MAP[raw]) return LEGACY_TAB_MAP[raw]
  if (isEkipTabId(raw)) return raw
  return 'members'
}

export function ekipTabLabel(t: (key: string) => string, id: EkipTabId): string {
  const tab = TABS.find(row => row.id === id)
  return tab ? t(tab.labelKey) : ''
}

type Props = {
  activeTab: EkipTabId
}

export function EkipTabNav({ activeTab }: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: ws } = useWorkspace()

  function warmSummaryMetrics() {
    if (!ws?.workspaceId || !hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) return
    void prefetchEkipRankingMetrics(queryClient, ws.workspaceId, ws)
  }

  function warmTrainingMetrics() {
    if (!ws?.workspaceId) return
    void prefetchEkipTrainingMetrics(queryClient, ws.workspaceId, ws)
  }

  function selectTab(id: EkipTabId) {
    if (id === 'summary') warmSummaryMetrics()
    if (id === 'training') warmTrainingMetrics()
    router.replace(`/ekip?tab=${id}`, { scroll: false })
  }

  return (
    <HorizontalScrollLock
      className="mb-6 flex w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-sm scrollbar-none"
      role="tablist"
      aria-label={t('team.title')}
    >
      {TABS.map(({ id, labelKey, icon: Icon, activeClass }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onMouseEnter={
              id === 'summary'
                ? warmSummaryMetrics
                : id === 'training'
                  ? warmTrainingMetrics
                  : undefined
            }
            onFocus={
              id === 'summary'
                ? warmSummaryMetrics
                : id === 'training'
                  ? warmTrainingMetrics
                  : undefined
            }
            onClick={() => selectTab(id)}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            className={clsx(
              'flex h-10 min-w-0 flex-1 shrink-0 items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition-all duration-200 active:scale-[0.98] sm:gap-2 sm:h-auto sm:min-w-[4.5rem] sm:py-2.5 sm:text-sm',
              isActive ? activeClass : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
            )}
          >
            <Icon className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span className="hidden truncate sm:inline">{t(labelKey)}</span>
          </button>
        )
      })}
    </HorizontalScrollLock>
  )
}
