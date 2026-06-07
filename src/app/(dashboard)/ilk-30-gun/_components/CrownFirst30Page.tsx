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
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { queryKeys } from '@/lib/query/keys'
import { FeatureUpgradeGate } from '@/components/ui/FeatureUpgradeGate'
import { Skeleton } from '@/components/ui/Skeleton'
import { waHref } from '@/lib/utils/waLink'

export function CrownFirst30Page({ asTab = false }: { asTab?: boolean }) {
  const { t, lang } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const locked = !hasTeamPageAccess(ws?.licenseType, ws?.isSuperAdmin)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.crownFirst30(ws?.workspaceId ?? ''),
    queryFn: () => getCrownFirst30PageAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId && !locked,
    staleTime: 30_000,
  })

  const members = data?.members ?? []

  return (
    <HubPageShell
      title={t('dashboard.crownMockFirst30Days')}
      subtitle={t('crown.first30Subtitle')}
      icon={CalendarDays}
      iconClassName="bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
      backHref="/pano"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'first30'] })}
      refreshing={isFetching}
      asTab={asTab}
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
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="text-center text-sm text-[var(--text-3)]">{t('crown.emptyTeam')}</p>
          ) : (
            <ul className="space-y-3">
              {members.map(m => {
                const wa = waHref(m.phone)
                const barColor =
                  m.riskLevel === 'danger'
                    ? 'bg-rose-500'
                    : m.riskLevel === 'warn'
                      ? 'bg-amber-400'
                      : m.pct >= 100
                        ? 'bg-emerald-500'
                        : 'bg-teal-500'
                const missingLabels = m.missingStepIds
                  .slice(0, 3)
                  .map(id => {
                    const step = ONBOARDING_STEPS.find(s => s.id === id)
                    return step ? (lang === 'en' ? step.label_en : step.label_tr) : id
                  })
                return (
                  <li
                    key={m.userId}
                    className={clsx(
                      'rounded-2xl border p-4',
                      m.riskLevel === 'danger'
                        ? 'border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/15'
                        : 'border-[var(--border)] bg-[var(--bg-card)]',
                    )}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <PersonAvatar name={m.fullName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-[var(--text-1)]">{m.fullName}</p>
                          <span
                            className={clsx(
                              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                              m.daysLeft <= 7
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
                            )}
                          >
                            {t('crown.daysLeft', { count: m.daysLeft })}
                          </span>
                        </div>
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
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 text-[#128C7E]"
                          title={t('crown.openWa')}
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      <div className={clsx('h-full rounded-full transition-all', barColor)} style={{ width: `${m.pct}%` }} />
                    </div>
                    {missingLabels.length > 0 ? (
                      <p className="text-xs text-[var(--text-3)]">
                        {t('crown.missingSteps', { steps: missingLabels.join(' · ') })}
                      </p>
                    ) : null}
                  </li>
                )
              })}
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
