'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useTranslation } from '@/providers/LanguageProvider'
import type { NmmCandidate } from '@/types/database.types'
import {
  buildCalendarByDate,
  earliestOverdueKey,
  getOverdueCandidates,
  monthCalendarStats,
  nearestFollowUpKey,
  CALENDAR_TERMINAL_STAGES,
} from '@/lib/domain/calendarFollowUp'
import {
  formatCalendarMonth,
  formatCalendarDayKey,
  weekdayShortLabels,
} from '@/lib/utils/calendarLocale'
import {
  toCalendarKey,
  fromCalendarKey,
  keysForDaysAfter,
  todayCalendarKey,
} from '@/lib/utils/calendarDates'
import {
  bulkDeferOverdueFollowUpsAction,
  clearFollowUpAction,
  deferFollowUpAction,
} from '../actions'
import { TakvimCandidateRow } from './TakvimCandidateRow'
import { TakvimTeamCalendar } from './TakvimTeamCalendar'
import { TakvimConfirmModal } from './TakvimConfirmModal'

export function TakvimClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { lang, t } = useTranslation()
  const { data: ws } = useWorkspace()
  const { candidates = [] } = useCandidates(ws?.workspaceId)

  const [mounted] = useState(() => typeof window !== 'undefined')
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)

  const todayKey = useMemo(() => todayCalendarKey(), [])
  const today = useMemo(() => fromCalendarKey(todayKey), [todayKey])

  const [view, setView] = useState(() => {
    const anchor = fromCalendarKey(todayCalendarKey())
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12, 0, 0)
  })
  const [selected, setSelected] = useState(() => todayCalendarKey())


  const byDate = useMemo(() => buildCalendarByDate(candidates), [candidates])

  // Terminal aşamadaki adaylar (katıldı, pasif…) takvimde manuel tarihleriyle
  // görünür ama toplu ertelemeye dahil edilmez — bu yüzden sayaç ve liste ondan arınık.
  const overdueCandidates = useMemo(
    () =>
      getOverdueCandidates(byDate, todayKey).filter(
        c => !CALENDAR_TERMINAL_STAGES.includes(c.stage),
      ),
    [byDate, todayKey],
  )

  const overdueCount = overdueCandidates.length

  const earliestOverdue = useMemo(
    () => earliestOverdueKey(byDate, todayKey),
    [byDate, todayKey],
  )

  const nearestDay = useMemo(
    () => nearestFollowUpKey(selected, byDate),
    [selected, byDate],
  )

  const monthStats = useMemo(
    () => monthCalendarStats(view.getFullYear(), view.getMonth(), byDate, todayKey),
    [view, byDate, todayKey],
  )

  const { days, startPad } = useMemo(() => {
    const year = view.getFullYear()
    const month = view.getMonth()
    const firstDay = new Date(year, month, 1, 12, 0, 0)
    const pad = (firstDay.getDay() + 6) % 7
    const total = new Date(year, month + 1, 0).getDate()
    return { days: total, startPad: pad }
  }, [view])

  const weekdayLabels = useMemo(() => weekdayShortLabels(lang), [lang])

  const next7Keys = useMemo(
    () => keysForDaysAfter(selected, 7).filter(k => byDate[k]),
    [selected, byDate],
  )

  const nextMonthKeys = useMemo(() => {
    const nextMonthDate = new Date(view.getFullYear(), view.getMonth() + 1, 1, 12, 0, 0)
    const nmYear = nextMonthDate.getFullYear()
    const nmMonth = nextMonthDate.getMonth()
    const daysInNm = new Date(nmYear, nmMonth + 1, 0).getDate()
    const next7Set = new Set(keysForDaysAfter(selected, 7))

    return Array.from({ length: daysInNm }, (_, i) => {
      const d = new Date(nmYear, nmMonth, i + 1, 12, 0, 0)
      return toCalendarKey(d)
    }).filter(k => byDate[k] && !next7Set.has(k))
  }, [view, selected, byDate])

  const isViewingTodayMonth =
    view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth()
  const showBackToToday = selected !== todayKey || !isViewingTodayMonth
  const showTeamCalendar = ws?.licenseType === 'pro' || ws?.isSuperAdmin

  const invalidateCalendar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['candidates', ws?.workspaceId] })
    queryClient.invalidateQueries({ queryKey: ['takvim-team', ws?.workspaceId] })
  }, [queryClient, ws?.workspaceId])

  const showPipelineToast = useCallback((candidateId: string) => {
    toast.success(t('pagesUi.followUpUpdated'), {
      action: {
        label: t('pagesUi.viewInPipeline'),
        onClick: () => router.push(`/pipeline/${candidateId}`),
      },
    })
  }, [router, t])

  const deferMutation = useMutation({
    mutationFn: ({ candidateId, days }: { candidateId: string; days: number }) =>
      deferFollowUpAction(ws!.workspaceId, candidateId, selected, days),
    onSuccess: (_data, { candidateId }) => {
      invalidateCalendar()
      showPipelineToast(candidateId)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const clearMutation = useMutation({
    mutationFn: (candidateId: string) =>
      clearFollowUpAction(ws!.workspaceId, candidateId, selected),
    onSuccess: () => {
      invalidateCalendar()
      toast.success(t('pagesUi.followUpCompleted'))
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const bulkDeferMutation = useMutation({
    mutationFn: () => {
      const ids = overdueCandidates.map(c => c.id)
      const targetDateKey = keysForDaysAfter(todayKey, 1)[0]
      return bulkDeferOverdueFollowUpsAction(ws!.workspaceId, ids, targetDateKey)
    },
    onSuccess: ({ updated }) => {
      setBulkConfirmOpen(false)
      invalidateCalendar()
      if (updated === 0) {
        toast.error(t('pagesUi.bulkDeferNone'))
        return
      }
      toast.success(t('pagesUi.bulkDeferSuccess', { count: updated }))
      selectCalendarDate(keysForDaysAfter(todayKey, 1)[0])
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const isBusy =
    deferMutation.isPending || clearMutation.isPending || bulkDeferMutation.isPending

  function prevMonth() {
    setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1, 12, 0, 0))
  }

  function nextMonth() {
    setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1, 12, 0, 0))
  }

  const selectCalendarDate = useCallback((key: string) => {
    const d = fromCalendarKey(key)
    setView(new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0))
    setSelected(key)
  }, [])

  function goToToday() {
    selectCalendarDate(todayKey)
  }

  if (!mounted || !ws?.workspaceId) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  const selectedCandidates = byDate[selected] ?? []
  const selectedTitle =
    selected === todayKey ? t('pagesUi.today') : formatCalendarDayKey(selected, lang)

  return (
    <div className="space-y-5">
      {bulkConfirmOpen && (
        <TakvimConfirmModal
          title={t('pagesUi.bulkDeferTitle')}
          message={t('pagesUi.bulkDeferMessage', {
            count: overdueCandidates.length,
            date: formatCalendarDayKey(keysForDaysAfter(todayKey, 1)[0], lang),
          })}
          confirmLabel={t('pagesUi.bulkDeferConfirm')}
          cancelLabel={t('common.cancel')}
          isLoading={bulkDeferMutation.isPending}
          onConfirm={() => bulkDeferMutation.mutate()}
          onCancel={() => setBulkConfirmOpen(false)}
        />
      )}

      {overdueCount > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#FBEAF0] bg-[#FBEAF0]/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => earliestOverdue && selectCalendarDate(earliestOverdue)}
            className="flex items-center gap-2 text-left"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#72243E]" />
            <p className="text-sm font-semibold text-[#72243E]">
              {t('pagesUi.overdueFollowUps', { count: overdueCount })}
            </p>
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setBulkConfirmOpen(true)}
              disabled={isBusy}
              className="text-xs font-semibold text-[#72243E] underline-offset-2 hover:underline disabled:opacity-50"
            >
              {t('pagesUi.bulkDeferOneDay')}
            </button>
            <Link
              href="/saha-ozetim?tab=daily"
              className="text-xs font-semibold text-[#72243E] underline-offset-2 hover:underline"
            >
              {t('pagesUi.viewTodayPriorities')}
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:text-[var(--text-1)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <span className="text-sm font-bold text-[var(--text-1)]">
            {formatCalendarMonth(view, lang)} {view.getFullYear()}
          </span>
          {(monthStats.total > 0 || monthStats.overdue > 0) && (
            <p className="mt-0.5 text-[11px] text-[var(--text-2)]">
              {t('pagesUi.monthSummary', {
                total: monthStats.total,
                overdue: monthStats.overdue,
              })}
            </p>
          )}
        </div>

        {showBackToToday && (
          <button
            type="button"
            onClick={goToToday}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-brand-subtle dark:bg-brand/15 px-2.5 py-1.5 text-xs font-semibold text-brand dark:text-[var(--text-1)] transition hover:bg-brand/15 dark:hover:bg-brand dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('pagesUi.backToToday')}
          </button>
        )}

        <button
          type="button"
          onClick={nextMonth}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:text-[var(--text-1)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
        <div className="mb-1 grid grid-cols-7">
          {weekdayLabels.map(d => (
            <div key={d} className="py-1 text-center text-[10px] font-semibold text-[var(--text-3)]">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: startPad }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1
            const date = new Date(view.getFullYear(), view.getMonth(), day, 12, 0, 0)
            const key = toCalendarKey(date)
            const isToday = key === todayKey
            const isSelected = key === selected
            const hasDot = !!byDate[key]
            const isPast = key < todayKey && !isToday
            const isOverdue = isPast && hasDot

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(key)}
                className={`relative flex flex-col items-center justify-center rounded-xl py-2 text-sm font-medium transition-colors
                  ${isSelected ? 'bg-brand text-white' :
                    isToday ? 'bg-brand-subtle text-brand' :
                    isOverdue ? 'text-[#72243E]' :
                    'text-[var(--text-1)] hover:bg-[var(--bg-subtle)]'}
                  ${isPast && !isOverdue ? 'opacity-40' : ''}`}
              >
                {day}
                {hasDot && (
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${
                    isSelected ? 'bg-white' :
                    isOverdue ? 'bg-[#72243E]' :
                    'bg-brand dark:bg-white/90'
                  }`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--text-1)]">
          {selectedTitle} — {t('pagesUi.followUpList')}
        </p>

        {selected < todayKey && selectedCandidates.length > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#FBEAF0] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[#72243E]" />
            <p className="text-xs font-semibold text-[#72243E]">
              {t('pagesUi.followUpsMissed', { count: selectedCandidates.length })}
            </p>
          </div>
        )}

        {selectedCandidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center">
            <p className="mb-1 text-2xl">✅</p>
            <p className="text-sm font-semibold text-[var(--text-1)]">
              {t('pagesUi.noFollowUpsThisDay')}
            </p>
            {nearestDay && nearestDay !== selected ? (
              <button
                type="button"
                onClick={() => selectCalendarDate(nearestDay)}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-subtle dark:bg-brand/15 px-3 py-1.5 text-xs font-semibold text-brand dark:text-[var(--text-1)] transition hover:bg-brand/15 dark:hover:bg-brand dark:hover:text-white"
              >
                {t('pagesUi.nearestFollowUp', {
                  date: formatCalendarDayKey(nearestDay, lang),
                  count: byDate[nearestDay].length,
                })}
              </button>
            ) : (
              <p className="mt-1 text-xs text-[var(--text-2)]">
                {t('pagesUi.checkAnotherDay')}
              </p>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {selectedCandidates.map((c: NmmCandidate) => (
              <TakvimCandidateRow
                key={c.id}
                candidate={c}
                lang={lang}
                deferLabel={t('pipelinePage.rescheduleContact')}
                completeLabel={t('pipelinePage.removeFollowUp')}
                dayLabel={t('pipelinePage.day')}
                daysLabel={t('pipelinePage.days')}
                onOpen={() => router.push(`/pipeline/${c.id}`)}
                onDefer={days => deferMutation.mutate({ candidateId: c.id, days })}
                onComplete={() => clearMutation.mutate(c.id)}
                isBusy={isBusy}
              />
            ))}
          </ul>
        )}
      </div>

      {next7Keys.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-[var(--text-1)]">
            {t('pagesUi.next7Days')}
          </p>
          <ul className="space-y-1.5">
            {next7Keys.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => selectCalendarDate(k)}
                className="flex w-full items-center justify-between rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-left transition hover:bg-[var(--border)]"
              >
                <span className="text-sm text-[var(--text-1)]">{formatCalendarDayKey(k, lang)}</span>
                <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                  {byDate[k].length}{' '}
                  {byDate[k].length === 1 ? t('pagesUi.prospectSingular') : t('pagesUi.prospectPlural')}
                </span>
              </button>
            ))}
          </ul>
        </div>
      )}

      {nextMonthKeys.length > 0 && (() => {
        const nextMonthDate = new Date(view.getFullYear(), view.getMonth() + 1, 1, 12, 0, 0)
        const nmYear = nextMonthDate.getFullYear()
        return (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="mb-3 text-sm font-semibold text-[var(--text-1)]">
              {t('pagesUi.nextMonth')} ({formatCalendarMonth(nextMonthDate, lang)} {nmYear})
            </p>
            <ul className="space-y-1.5">
              {nextMonthKeys.map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => selectCalendarDate(k)}
                  className="flex w-full items-center justify-between rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-left transition hover:bg-[var(--border)]"
                >
                  <span className="text-sm text-[var(--text-1)]">{formatCalendarDayKey(k, lang)}</span>
                  <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-brand">
                    {byDate[k].length}{' '}
                    {byDate[k].length === 1 ? t('pagesUi.prospectSingular') : t('pagesUi.prospectPlural')}
                  </span>
                </button>
              ))}
            </ul>
          </div>
        )
      })()}

      {showTeamCalendar && (
        <TakvimTeamCalendar
          workspaceId={ws.workspaceId}
          year={view.getFullYear()}
          month={view.getMonth()}
          lang={lang}
          title={t('pagesUi.teamCalendarTitle')}
          subtitle={t('pagesUi.teamCalendarSubtitle')}
          emptyLabel={t('pagesUi.teamCalendarEmpty')}
        />
      )}
    </div>
  )
}
