'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, useUpdateCandidate } from '@/hooks/useCandidates'
import type { NmmCandidate } from '@/types/database.types'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  buildCalendarByDate,
  countOverdueFollowUps,
  earliestOverdueKey,
  nearestFollowUpKey,
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
  weekKeysContaining,
} from '@/lib/utils/calendarDates'
import { TakvimCandidateRow } from './TakvimCandidateRow'
import { TakvimWeekStrip } from './TakvimWeekStrip'

export function TakvimClient() {
  const router = useRouter()
  const { lang, t } = useTranslation()
  const { data: ws } = useWorkspace()
  const { candidates = [] } = useCandidates(ws?.workspaceId)
  const update = useUpdateCandidate(ws?.workspaceId ?? '')

  const [mounted, setMounted] = useState(false)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d
  }, [])

  const todayKey = useMemo(() => toCalendarKey(today), [today])

  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0))
  const [selected, setSelected] = useState<string>(todayKey)

  useEffect(() => {
    setMounted(true)
  }, [])

  const byDate = useMemo(() => buildCalendarByDate(candidates), [candidates])

  const overdueCount = useMemo(
    () => countOverdueFollowUps(byDate, todayKey),
    [byDate, todayKey],
  )

  const earliestOverdue = useMemo(
    () => earliestOverdueKey(byDate, todayKey),
    [byDate, todayKey],
  )

  const nearestDay = useMemo(
    () => nearestFollowUpKey(selected, byDate),
    [selected, byDate],
  )

  const weekKeys = useMemo(() => weekKeysContaining(selected), [selected])

  const { days, startPad } = useMemo(() => {
    const year = view.getFullYear()
    const month = view.getMonth()
    const firstDay = new Date(year, month, 1, 12, 0, 0)
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0)
    const pad = (firstDay.getDay() + 6) % 7
    const total = lastDay.getDate()
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

  const deferFollowUp = useCallback((candidateId: string, days: number) => {
    const base = fromCalendarKey(selected)
    base.setDate(base.getDate() + days)
    base.setHours(12, 0, 0, 0)
    update.mutate({ id: candidateId, next_follow_up_at: base.toISOString() })
  }, [selected, update])

  if (!mounted) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
      </div>
    )
  }

  const selectedCandidates = byDate[selected] ?? []
  const selectedTitle =
    selected === todayKey ? t('pagesUi.today') : formatCalendarDayKey(selected, lang)

  return (
    <div className="space-y-5">
      {/* Gecikmiş takip özeti */}
      {overdueCount > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#FBEAF0] bg-[#FBEAF0]/60 px-4 py-3">
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
          <Link
            href="/bugun/ilgilen"
            className="text-xs font-semibold text-[#72243E] underline-offset-2 hover:underline"
          >
            {t('pagesUi.viewTodayPriorities')}
          </Link>
        </div>
      )}

      {/* Ay navigasyonu */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:text-[var(--text-1)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="min-w-0 flex-1 text-center text-sm font-bold text-[var(--text-1)]">
          {formatCalendarMonth(view, lang)} {view.getFullYear()}
        </span>

        {showBackToToday && (
          <button
            type="button"
            onClick={goToToday}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-[#EEEDFE] px-2.5 py-1.5 text-xs font-semibold text-[#534AB7] transition hover:bg-[#534AB7]/15"
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

      {/* Haftalık şerit — masaüstü */}
      <TakvimWeekStrip
        weekKeys={weekKeys}
        selected={selected}
        todayKey={todayKey}
        byDate={byDate}
        lang={lang}
        title={t('pagesUi.weekView')}
        onSelect={selectCalendarDate}
      />

      {/* Ay grid */}
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
                  ${isSelected ? 'bg-[#534AB7] text-white' :
                    isToday ? 'bg-[#EEEDFE] text-[#534AB7]' :
                    isOverdue ? 'text-[#72243E]' :
                    'text-[var(--text-1)] hover:bg-[var(--bg-subtle)]'}
                  ${isPast && !isOverdue ? 'opacity-40' : ''}`}
              >
                {day}
                {hasDot && (
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${
                    isSelected ? 'bg-white' :
                    isOverdue ? 'bg-[#72243E]' :
                    'bg-[#534AB7]'
                  }`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Seçilen güne ait adaylar */}
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
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#EEEDFE] px-3 py-1.5 text-xs font-semibold text-[#534AB7] transition hover:bg-[#534AB7]/15"
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
                dayLabel={t('pipelinePage.day')}
                daysLabel={t('pipelinePage.days')}
                onOpen={() => router.push(`/pipeline/${c.id}`)}
                onDefer={days => deferFollowUp(c.id, days)}
                isDeferring={update.isPending}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Seçili günden sonraki 7 gün */}
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
                <span className="rounded-full bg-[#EEEDFE] px-2.5 py-0.5 text-xs font-semibold text-[#534AB7]">
                  {byDate[k].length}{' '}
                  {byDate[k].length === 1 ? t('pagesUi.prospectSingular') : t('pagesUi.prospectPlural')}
                </span>
              </button>
            ))}
          </ul>
        </div>
      )}

      {/* Görüntülenen ayın bir sonraki ayı */}
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
                  <span className="rounded-full bg-[#EEEDFE] px-2.5 py-0.5 text-xs font-semibold text-[#534AB7]">
                    {byDate[k].length}{' '}
                    {byDate[k].length === 1 ? t('pagesUi.prospectSingular') : t('pagesUi.prospectPlural')}
                  </span>
                </button>
              ))}
            </ul>
          </div>
        )
      })()}
    </div>
  )
}
