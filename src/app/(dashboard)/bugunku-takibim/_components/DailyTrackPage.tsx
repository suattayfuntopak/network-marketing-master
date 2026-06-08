'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, ExternalLink, Loader2, Target } from 'lucide-react'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { useUserGoal } from '@/hooks/useUserGoal'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { queryKeys } from '@/lib/query/keys'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import { getDailyTrackAction, saveDailyTrackAction } from '../actions'
import { DailyMetricReadonlyRow } from './DailyMetricReadonlyRow'
import { dailyTrackAccent } from './dailyTrackTheme'

const METRIC_KEYS: { key: keyof FunnelCounts; labelKey: string }[] = [
  { key: 'arama', labelKey: 'dashboard.dailyTrackMetricCalls' },
  { key: 'tanisma', labelKey: 'dashboard.dailyTrackMetricMeetings' },
  { key: 'sunum', labelKey: 'dashboard.dailyTrackMetricPresentations' },
  { key: 'yeniUye', labelKey: 'dashboard.dailyTrackMetricMembers' },
]

export function DailyTrackPage() {
  const { t, lang } = useTranslation()
  const qc = useQueryClient()
  const { goal, progress } = useUserGoal()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.dailyTrack(lang),
    queryFn: () => getDailyTrackAction(lang),
    staleTime: 30_000,
  })

  const [notes, setNotes] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!data) return
    setNotes(data.notes)
    setInitialized(true)
  }, [data])

  const save = useMutation({
    mutationFn: () => saveDailyTrackAction({ notes, lang }),
    onSuccess: async result => {
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(t('dashboard.dailyTrackSaved'))
      await qc.invalidateQueries({ queryKey: queryKeys.dailyTrack(lang) })
    },
    onError: () => toast.error(t('common.error')),
  })

  const actuals = data?.actuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

  return (
    <HubPageShell
      title={t('dashboard.panoDailyWhatIDid')}
      icon={ClipboardList}
      iconClassName={dailyTrackAccent.icon}
      backHref="/pano"
      showRefresh={false}
    >
      {goal && progress?.hasGoal ? (
        <Link
          href="/hedefim"
          className={clsx(
            'flex items-center gap-3 rounded-2xl border px-4 py-3 transition',
            dailyTrackAccent.banner,
          )}
        >
          <Target className={clsx('h-5 w-5 shrink-0', dailyTrackAccent.bannerIcon)} strokeWidth={1.75} />
          <p className={clsx('text-sm font-medium', dailyTrackAccent.bannerText)}>
            {t('crown.goalBanner', {
              months: goal.targetMonths,
              people: goal.targetPeople,
            })}
          </p>
        </Link>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)]/50 px-4 py-3 text-sm text-[var(--text-3)]">
          {t('crown.noGoal')}
        </p>
      )}

      <Link
        href="/pipeline"
        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 px-4 py-3 text-sm transition hover:border-brand/30 hover:bg-[var(--bg-subtle)]/70"
      >
        <span className="text-[var(--text-2)]">{t('dashboard.dailyTrackPipelineCta')}</span>
        <ExternalLink className="h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
      </Link>

      <p className="text-xs leading-relaxed text-[var(--text-3)]">{t('dashboard.dailyTrackAutoHint')}</p>

      <section className="space-y-3">
        {isLoading && !initialized ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[5.5rem] animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
            ))}
          </div>
        ) : (
          <div className={clsx('flex flex-col gap-3', isFetching && 'opacity-80')}>
            {METRIC_KEYS.map(({ key, labelKey }) => {
              const target = progress?.hasGoal ? progress.targets[key] : 0
              return (
                <DailyMetricReadonlyRow
                  key={key}
                  metric={key}
                  label={t(labelKey)}
                  value={actuals[key]}
                  targetLabel={target > 0 ? t('crown.targetSuffix', { target }) : undefined}
                />
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('dashboard.dailyTrackNotesTitle')}</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder={t('dashboard.dailyTrackNotesPlaceholder')}
          className={clsx(
            'w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)] focus:ring-2',
            dailyTrackAccent.inputFocus,
          )}
        />
      </section>

      <section className="border-t border-[var(--border)] pt-4">
        <button
          type="button"
          disabled={save.isPending || isLoading}
          onClick={() => save.mutate()}
          className={clsx(
            'flex w-full min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-60',
            dailyTrackAccent.saveBtn,
          )}
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('dashboard.dailyTrackSaveNotes')}
        </button>
      </section>
    </HubPageShell>
  )
}
