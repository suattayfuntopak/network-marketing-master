'use client'

import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Film, PlayCircle, Video } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubSectionCard } from '@/lib/ui/hub/HubSectionCard'
import { PanoVideoStrip } from '@/app/(dashboard)/pano/_components/PanoVideoStrip'
import { getCrownVideoPageAction } from '@/app/(dashboard)/crown/actions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { Skeleton } from '@/components/ui/Skeleton'

export function CrownVideoPage({ asTab = false }: { asTab?: boolean }) {
  const { t, lang } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'video', ws?.workspaceId],
    queryFn: () => getCrownVideoPageAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  const members = data?.members ?? []
  const videoTotal = data?.videoTotal ?? 0
  const leaderPct = data?.leaderSummary?.pct ?? 0
  const teamAvg = data?.teamAvgPct ?? 0

  const videoTitle = (tr: string, en: string) => (lang === 'en' ? en : tr)

  return (
    <HubPageShell
      title={t('dashboard.crownMockLiveTraining')}
      subtitle={t('crown.videoSubtitle')}
      icon={Video}
      iconClassName="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
      backHref="/pano"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'video'] })}
      refreshing={isFetching}
      asTab={asTab}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
            {t('crown.videoYourProgress')}
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-teal-700 dark:text-teal-400">%{leaderPct}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
            {t('crown.videoTeamAvg')}
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-brand">%{teamAvg}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
            {t('crown.videoCatalogCount')}
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums text-[var(--text-1)]">{videoTotal}</p>
        </div>
      </div>

      {(data?.lastWatched || data?.nextVideo) && (
        <HubSectionCard title={t('crown.videoContinueTitle')}>
          <div className="space-y-3">
            {data?.lastWatched ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
                  {t('crown.videoLastWatched')}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[var(--text-1)]">
                  {videoTitle(data.lastWatched.titleTr, data.lastWatched.titleEn)}
                </p>
              </div>
            ) : null}
            {data?.nextVideo ? (
              <Link
                href="/egitim/videolar"
                className="flex items-center gap-3 rounded-xl border border-teal-500/25 bg-teal-50/50 px-3 py-2.5 transition hover:bg-teal-50 dark:bg-teal-950/20"
              >
                <PlayCircle className="h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-teal-800/70 dark:text-teal-300/70">
                    {t('crown.videoUpNext')}
                  </p>
                  <p className="truncate text-sm font-semibold text-[var(--text-1)]">
                    {videoTitle(data.nextVideo.titleTr, data.nextVideo.titleEn)}
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-[var(--text-3)]" />
              </Link>
            ) : (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('crown.videoAllDone')}</p>
            )}
          </div>
        </HubSectionCard>
      )}

      <PanoVideoStrip />

      <HubSectionCard title={t('crown.videoTeamTitle')}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-[var(--text-3)]">{t('crown.emptyTeam')}</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {members.map(m => {
              const summary = data?.videoMap[m.user_id]
              const pct = summary?.pct ?? 0
              const done = summary?.completed ?? 0
              return (
                <li key={m.user_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <PersonAvatar name={m.full_name ?? '?'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--text-1)]">
                        {m.full_name ?? '—'}
                      </p>
                      <span
                        className={clsx(
                          'shrink-0 text-sm font-bold tabular-nums',
                          pct > 0 ? 'text-teal-700 dark:text-teal-400' : 'text-[var(--text-3)]',
                        )}
                      >
                        %{pct}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-3)]">
                      {t('crown.videosWatched', { total: videoTotal, done })}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </HubSectionCard>

      <Link
        href="/egitim/videolar"
        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:bg-[var(--bg-subtle)]"
      >
        <div className="flex items-center gap-2.5">
          <Film className="h-5 w-5 text-teal-700 dark:text-teal-400" strokeWidth={1.75} />
          <span className="text-sm font-semibold text-[var(--text-1)]">{t('crown.videoFullCatalog')}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
      </Link>
    </HubPageShell>
  )
}
