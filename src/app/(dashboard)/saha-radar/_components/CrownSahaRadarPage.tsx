'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, ChevronRight, Clock, Users } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubSectionCard } from '@/lib/ui/hub/HubSectionCard'
import { getCrownSahaRadarAction } from '@/app/(dashboard)/crown/actions'
import type { SahaRadarMember, SahaRadarFollowUp } from '@/app/(dashboard)/crown/actions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { FeatureUpgradeGate } from '@/components/ui/FeatureUpgradeGate'
import { queryKeys } from '@/lib/query/keys'
import { waHref } from '@/lib/utils/waLink'

type InnerTab = 'aktivite' | 'takipler'

function ActivityDot({ level }: { level: 'active' | 'recent' | 'silent' }) {
  return (
    <span
      className={clsx(
        'inline-block h-2.5 w-2.5 rounded-full shrink-0',
        level === 'active' ? 'bg-emerald-500' : level === 'recent' ? 'bg-amber-400' : 'bg-rose-500',
      )}
    />
  )
}

function MemberCard({ m, t }: { m: SahaRadarMember; t: ReturnType<typeof useTranslation>['t'] }) {
  const labelKey =
    m.activityLevel === 'active'
      ? 'crown.sahaRadarActive'
      : m.activityLevel === 'recent'
        ? 'crown.sahaRadarRecent'
        : 'crown.sahaRadarSilent'
  const daysBadge =
    m.daysSinceActivity === null
      ? t('crown.sahaRadarNeverActive')
      : m.daysSinceActivity === 0
        ? t('crown.sahaRadarToday')
        : t('crown.sahaRadarDaysAgo', { count: m.daysSinceActivity })

  return (
    <li className={clsx(
      'flex items-center gap-3 rounded-2xl border px-4 py-3',
      m.activityLevel === 'silent'
        ? 'border-rose-500/25 bg-rose-50/30 dark:bg-rose-950/15'
        : 'border-[var(--border)] bg-[var(--bg-card)]',
    )}>
      <PersonAvatar name={m.fullName} imageUrl={m.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-1)]">{m.fullName}</p>
        <p className="text-xs text-[var(--text-3)]">{daysBadge}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={clsx(
          'text-[10px] font-bold rounded-full px-2 py-0.5',
          m.activityLevel === 'active'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
            : m.activityLevel === 'recent'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
        )}>
          {t(labelKey)}
        </span>
        <ActivityDot level={m.activityLevel} />
      </div>
    </li>
  )
}

function FollowUpCard({
  f,
  t,
  lang,
}: {
  f: SahaRadarFollowUp
  t: ReturnType<typeof useTranslation>['t']
  lang: 'tr' | 'en'
}) {
  const wa = f.phone ? waHref(f.phone) : null
  const dueDate = new Date(f.dueAt)
  const dateStr = dueDate.toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  })

  return (
    <li className={clsx(
      'flex items-center gap-3 rounded-2xl border px-4 py-3',
      f.isOverdue
        ? 'border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/15'
        : 'border-[var(--border)] bg-[var(--bg-card)]',
    )}>
      <Clock className={clsx('h-4 w-4 shrink-0', f.isOverdue ? 'text-rose-500' : 'text-amber-500')} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-1)]">{f.candidateName}</p>
        <p className="text-xs text-[var(--text-3)]">
          {f.isMine ? t('crown.sahaRadarMine') : f.ownerName} · {dateStr}
          {f.isOverdue && (
            <span className="ml-1 font-bold text-rose-500">{t('crown.sahaRadarOverdue')}</span>
          )}
        </p>
      </div>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 text-[#128C7E]"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
        </a>
      )}
    </li>
  )
}

export function CrownSahaRadarPage({ asTab = false }: { asTab?: boolean }) {
  const { t, lang } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const [innerTab, setInnerTab] = useState<InnerTab>('takipler')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.crownSahaRadar(ws?.workspaceId ?? ''),
    queryFn: () => getCrownSahaRadarAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  const overdue = data?.followUps.filter(f => f.isOverdue) ?? []
  const upcoming = data?.followUps.filter(f => !f.isOverdue) ?? []
  const activeMembers = data?.members.filter(m => m.activityLevel === 'active').length ?? 0
  const silentMembers = data?.members.filter(m => m.activityLevel === 'silent').length ?? 0

  return (
    <HubPageShell
      title={t('crown.sahaRadarTitle')}
      subtitle={t('crown.sahaRadarSubtitle')}
      icon={Activity}
      iconClassName="bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
      backHref="/pano"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'saha-radar'] })}
      refreshing={isFetching}
      asTab={asTab}
    >
      {/* Sekme çubuğu */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
        <button
          type="button"
          onClick={() => setInnerTab('takipler')}
          className={clsx(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
            innerTab === 'takipler'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          {t('crown.sahaRadarTabFollowUps')}
          {overdue.length > 0 && (
            <span className={clsx(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
              innerTab === 'takipler' ? 'bg-white/20 text-white' : 'bg-rose-500 text-white',
            )}>
              {overdue.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setInnerTab('aktivite')}
          className={clsx(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
            innerTab === 'aktivite'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
          )}
        >
          <Users className="h-3.5 w-3.5" />
          {t('crown.sahaRadarTabActivity')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB: Takipler */}
          {innerTab === 'takipler' && (
            <div className="space-y-4">
              {overdue.length === 0 && upcoming.length === 0 ? (
                <HubSectionCard>
                  <p className="text-center text-sm text-[var(--text-3)]">
                    {t('crown.sahaRadarNoFollowUps')}
                  </p>
                </HubSectionCard>
              ) : (
                <>
                  {overdue.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                        {t('crown.sahaRadarOverdueSection')} ({overdue.length})
                      </p>
                      <ul className="space-y-2">
                        {overdue.map(f => (
                          <FollowUpCard key={f.id} f={f} t={t} lang={lang} />
                        ))}
                      </ul>
                    </div>
                  )}
                  {upcoming.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
                        {t('crown.sahaRadarUpcomingSection')} ({upcoming.length})
                      </p>
                      <ul className="space-y-2">
                        {upcoming.map(f => (
                          <FollowUpCard key={f.id} f={f} t={t} lang={lang} />
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              <Link
                href="/pipeline"
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:bg-[var(--bg-subtle)]"
              >
                <span className="text-sm font-semibold text-[var(--text-1)]">
                  {t('crown.sahaRadarPipelineCta')}
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
              </Link>
            </div>
          )}

          {/* TAB: Aktivite */}
          {innerTab === 'aktivite' && (
            <div className="space-y-4">
              {!data?.hasTeamAccess ? (
                <FeatureUpgradeGate feature="team" locked>
                  {null}
                </FeatureUpgradeGate>
              ) : data.members.length === 0 ? (
                <p className="text-center text-sm text-[var(--text-3)]">
                  {t('crown.emptyTeam')}
                </p>
              ) : (
                <>
                  {/* Özet çipleri */}
                  <div className="flex gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        {t('crown.sahaRadarActiveCount', { count: activeMembers })}
                      </span>
                    </div>
                    {silentMembers > 0 && (
                      <div className="flex flex-1 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900/40 dark:bg-rose-950/20">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                          {t('crown.sahaRadarSilentCount', { count: silentMembers })}
                        </span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {data.members.map(m => (
                      <MemberCard key={m.userId} m={m} t={t} />
                    ))}
                  </ul>
                </>
              )}
              <Link
                href="/ekip"
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:bg-[var(--bg-subtle)]"
              >
                <span className="text-sm font-semibold text-[var(--text-1)]">
                  {t('crown.sahaRadarTeamCta')}
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
              </Link>
            </div>
          )}
        </>
      )}
    </HubPageShell>
  )
}
