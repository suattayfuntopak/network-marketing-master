'use client'

import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubSectionCard } from '@/lib/ui/hub/HubSectionCard'
import { getCrownFirst30PageAction } from '@/app/(dashboard)/crown/actions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { FeatureUpgradeGate } from '@/components/ui/FeatureUpgradeGate'
import { Skeleton } from '@/components/ui/Skeleton'

export function CrownFirst30Page() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const locked = !hasTeamPageAccess(ws?.licenseType, ws?.isSuperAdmin)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'first30', ws?.workspaceId],
    queryFn: () => getCrownFirst30PageAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId && !locked,
    staleTime: 30_000,
  })

  const members = data?.members ?? []

  return (
    <HubPageShell
      title={t('crown.first30Title')}
      subtitle={t('crown.first30Subtitle')}
      icon={CalendarDays}
      iconClassName="bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'first30'] })}
      refreshing={isFetching}
    >
      {locked ? (
        <FeatureUpgradeGate feature="team" locked>
          {null}
        </FeatureUpgradeGate>
      ) : (
        <>
          <HubSectionCard>
            <p className="text-sm text-[var(--text-2)] leading-relaxed">{t('crown.first30Hint')}</p>
          </HubSectionCard>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-sm text-[var(--text-3)]">{t('crown.emptyTeam')}</p>
          ) : (
            <ul className="space-y-3">
              {members.map(m => (
                <li
                  key={m.userId}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <PersonAvatar name={m.fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--text-1)]">{m.fullName}</p>
                      <p className="text-xs text-[var(--text-3)]">
                        {t('crown.tasksDone', { done: m.done, total: m.total })}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'shrink-0 text-sm font-bold tabular-nums',
                        m.pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                      )}
                    >
                      %{m.pct}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        m.pct >= 100 ? 'bg-emerald-500' : 'bg-amber-400',
                      )}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/ekip"
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:bg-[var(--bg-subtle)]"
          >
            <span className="text-sm font-semibold text-[var(--text-1)]">{t('crown.first30Cta')}</span>
            <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
          </Link>
        </>
      )}
    </HubPageShell>
  )
}
