'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Loader2, Target } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useUserGoal } from '@/hooks/useUserGoal'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { queryKeys } from '@/lib/query/keys'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import { getDailyTrackAction, saveDailyTrackAction } from '../actions'
import { DailyMetricRow } from './DailyMetricRow'

const METRIC_KEYS: { key: keyof FunnelCounts; field: 'calls' | 'contacts' | 'presentations' | 'newMembers'; labelKey: string }[] = [
  { key: 'arama', field: 'calls', labelKey: 'crown.metricCall' },
  { key: 'tanisma', field: 'contacts', labelKey: 'crown.metricMeet' },
  { key: 'sunum', field: 'presentations', labelKey: 'crown.metricPresentation' },
  { key: 'yeniUye', field: 'newMembers', labelKey: 'crown.metricMember' },
]

export function DailyTrackPage() {
  const { t, lang } = useTranslation()
  const qc = useQueryClient()
  const { goal, progress } = useUserGoal()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dailyTrack(lang),
    queryFn: () => getDailyTrackAction(lang),
    staleTime: 30_000,
  })

  const [calls, setCalls] = useState(0)
  const [contacts, setContacts] = useState(0)
  const [presentations, setPresentations] = useState(0)
  const [newMembers, setNewMembers] = useState(0)
  const [notes, setNotes] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!data) return
    setCalls(data.fieldLog.calls)
    setContacts(data.fieldLog.contacts)
    setPresentations(data.fieldLog.presentations)
    setNewMembers(data.fieldLog.newMembers)
    setNotes(data.notes)
    setInitialized(true)
  }, [data])

  const save = useMutation({
    mutationFn: () =>
      saveDailyTrackAction({
        calls,
        contacts,
        presentations,
        newMembers,
        notes,
        lang,
      }),
    onSuccess: async result => {
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(t('dashboard.dailyTrackSaved'))
      await qc.invalidateQueries({ queryKey: queryKeys.dailyTrack(lang) })
      await qc.invalidateQueries({ queryKey: queryKeys.goalDashboard() })
    },
    onError: () => toast.error(t('common.error')),
  })

  const setters = {
    calls: setCalls,
    contacts: setContacts,
    presentations: setPresentations,
    newMembers: setNewMembers,
  } as const

  const values = { calls, contacts, presentations, newMembers }

  return (
    <HubPageShell
      title={t('dashboard.dailyTrackTitle')}
      subtitle={t('crown.dailySubtitle')}
      icon={ClipboardList}
      iconClassName="bg-[#EEEDFE] text-[#534AB7] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
      backHref="/pano"
    >
      {goal && progress?.hasGoal ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#534AB7]/20 bg-[#EEEDFE]/50 px-4 py-3 dark:border-[#534AB7]/30 dark:bg-[#1e1b4b]/40">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-[#534AB7] dark:text-[#a5b4fc]" strokeWidth={1.75} />
          <p className="text-sm font-medium text-[var(--text-1)]">
            {t('crown.goalBanner', {
              months: goal.targetMonths,
              people: goal.targetPeople,
            })}
          </p>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)]/50 px-4 py-3 text-sm text-[var(--text-3)]">
          {t('crown.noGoal')}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('crown.performanceTitle')}</h2>
        {isLoading && !initialized ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[5.5rem] animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {METRIC_KEYS.map(({ key, field, labelKey }) => {
              const target = progress?.hasGoal ? progress.targets[key] : 0
              return (
                <DailyMetricRow
                  key={field}
                  label={t(labelKey)}
                  value={values[field]}
                  targetLabel={target > 0 ? t('crown.targetSuffix', { target }) : undefined}
                  onChange={setters[field]}
                />
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('crown.todayNotes')}</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder={t('dashboard.dailyTrackNotesPlaceholder')}
          className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)] focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
        />
      </section>

      <section className="space-y-3 border-t border-[var(--border)] pt-4">
        <h2 className="text-base font-bold text-[var(--text-1)]">{t('dashboard.dailyTrackAboutToday')}</h2>
        <button
          type="button"
          disabled={save.isPending || isLoading}
          onClick={() => save.mutate()}
          className="flex w-full min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#534AB7] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#453DA0] active:scale-[0.99] disabled:opacity-60"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('common.save')}
        </button>
      </section>
    </HubPageShell>
  )
}
