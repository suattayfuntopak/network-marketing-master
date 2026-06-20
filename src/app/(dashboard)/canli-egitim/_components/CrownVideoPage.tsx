'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ChevronRight, GraduationCap, PlayCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { usePersonalAkademiProgress } from '@/hooks/usePersonalAkademiProgress'
import { useVideoCatalog } from '@/hooks/useVideoCatalog'
import { deriveVideoContinueFromCatalog } from '@/lib/domain/videoContinue'
import { HubPageShell } from '@/components/hub/HubPageShell'
import { HubSectionCard } from '@/components/hub/HubSectionCard'
import { akademiHref, akademiVideoContinueHref } from '@/lib/domain/akademiTab'
import { AkademiTabLabel } from '@/components/ui/AkademiTabLabel'
import { AKADEMI_TAB_THEME, AKADEMI_TABS } from '@/lib/ui/akademiTabTheme'
import { Skeleton } from '@/components/ui/Skeleton'
import { pageHeaderIconClass } from '@/lib/ui/pageHeaderIcon'
import { videoProgressAccent } from './videoProgressTheme'

export function CrownVideoPage({ asTab = false }: { asTab?: boolean }) {
  const { t, lang } = useTranslation()
  const progress = usePersonalAkademiProgress()
  const { data: catalog, isLoading: catalogLoading } = useVideoCatalog()
  const { lastWatched, nextVideo } = useMemo(
    () => deriveVideoContinueFromCatalog(catalog),
    [catalog],
  )

  const videoTitle = (tr: string, en: string) => (lang === 'en' ? en : tr)

  const countCards = [
    { key: 'training' as const, ...progress.content },
    { key: 'videos' as const, read: progress.video.read, total: progress.video.total, pct: progress.video.pct },
    { key: 'objections' as const, ...progress.objection },
  ]

  const pctCards = [
    { key: 'training' as const, labelKey: 'crown.progressContentPct', pct: progress.content.pct },
    { key: 'videos' as const, labelKey: 'crown.progressVideoPct', pct: progress.video.pct },
    { key: 'objections' as const, labelKey: 'crown.progressObjectionPct', pct: progress.objection.pct },
  ]

  return (
    <HubPageShell
      title={t('dashboard.crownLiveTraining')}
      icon={GraduationCap}
      iconClassName={pageHeaderIconClass('/canli-egitim')}
      backHref="/pano"
      showRefresh={false}
      asTab={asTab}
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {countCards.map(({ key, read, total }) => (
          <div
            key={`count-${key}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4"
          >
            <p className="whitespace-nowrap text-[10px] font-bold uppercase leading-tight tracking-wide text-[var(--text-3)] sm:text-xs">
              <AkademiTabLabel tab={key} />
            </p>
            {progress.isLoading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <p className={clsx('mt-1 text-xl font-black tabular-nums sm:text-2xl', AKADEMI_TAB_THEME[key].textClass)}>
                {read}/{total}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {pctCards.map(({ key, labelKey, pct }) => (
          <div
            key={`pct-${key}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-[var(--text-3)] sm:text-xs">
              {t(labelKey)}
            </p>
            {progress.isLoading ? (
              <Skeleton className="mt-2 h-7 w-12" />
            ) : (
              <p className={clsx('mt-1 text-xl font-black tabular-nums sm:text-2xl', AKADEMI_TAB_THEME[key].textClass)}>
                %{pct}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--text-1)]">{t('crown.progressTotal')}</p>
          {progress.isLoading ? (
            <Skeleton className="h-6 w-10" />
          ) : (
            <span className={clsx('text-lg font-black tabular-nums', videoProgressAccent.textDark)}>
              %{progress.totalPct}
            </span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <div
            className={clsx('h-full rounded-full transition-all', videoProgressAccent.progress)}
            style={{ width: `${Math.min(100, progress.totalPct)}%` }}
          />
        </div>
      </div>

      {(catalogLoading || lastWatched || nextVideo) && (
        <HubSectionCard title={t('crown.videoContinueTitle')}>
          <div className="space-y-3">
            {catalogLoading ? (
              <Skeleton className="h-16 rounded-xl" />
            ) : (
              <>
                {lastWatched ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
                      {t('crown.videoLastWatched')}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-[var(--text-1)]">
                      {videoTitle(lastWatched.titleTr, lastWatched.titleEn)}
                    </p>
                  </div>
                ) : null}
                {nextVideo ? (
                  <Link
                    href={akademiVideoContinueHref(nextVideo.key)}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition',
                      videoProgressAccent.border,
                      videoProgressAccent.surface,
                      videoProgressAccent.surfaceHover,
                    )}
                  >
                    <PlayCircle className={clsx('h-5 w-5 shrink-0', videoProgressAccent.textDark)} />
                    <div className="min-w-0">
                      <p className={clsx('text-[10px] font-bold uppercase tracking-wide opacity-80', videoProgressAccent.textDark)}>
                        {t('crown.videoUpNext')}
                      </p>
                      <p className="truncate text-sm font-semibold text-[var(--text-1)]">
                        {videoTitle(nextVideo.titleTr, nextVideo.titleEn)}
                      </p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-[var(--text-3)]" />
                  </Link>
                ) : (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('crown.videoAllDone')}</p>
                )}
              </>
            )}
          </div>
        </HubSectionCard>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {AKADEMI_TABS.map(({ key }) => (
          <Link
            key={key}
            href={akademiHref(key)}
            className={clsx(
              'flex min-w-0 items-center justify-center whitespace-nowrap rounded-xl border px-1.5 py-3 text-center text-[10px] font-bold leading-tight transition active:scale-[0.98] sm:px-2 sm:text-xs',
              AKADEMI_TAB_THEME[key].navButtonClass,
            )}
          >
            <AkademiTabLabel tab={key} />
          </Link>
        ))}
      </div>
    </HubPageShell>
  )
}
