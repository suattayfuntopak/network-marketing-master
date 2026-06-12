'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Target, ChevronDown, Pencil, Rocket } from 'lucide-react'
import { clsx } from 'clsx'
import { useUserGoal } from '@/hooks/useUserGoal'
import { useTranslation } from '@/providers/LanguageProvider'
import { calendarMonthOffsetForRoadmapMonth, type FunnelCounts } from '@/lib/domain/roadmap'
import {
  FUNNEL_METRIC_VIVID_CLASS,
  FUNNEL_METRIC_VISUAL,
  FunnelMetricCount,
} from '@/lib/ui/funnelMetricVisuals'
import { HubCrownFunnelGrid } from '@/components/hub/HubCrownFunnelGrid'

const MONTH_OPTIONS = [3, 6, 9, 12, 18, 24, 36]

const EMPTY_FUNNEL: FunnelCounts = { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

export function HedefKart() {
  const { t } = useTranslation()
  const { goal, progress, roadmap, isLoading, saveGoal, isSaving } = useUserGoal()
  const [editing, setEditing] = useState(false)
  const [people, setPeople] = useState('')
  const [months, setMonths] = useState(12)
  const [showRoadmap, setShowRoadmap] = useState(true)

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
  }

  async function handleSave() {
    const p = parseInt(people, 10)
    if (!p || p < 1) return
    await saveGoal({ targetPeople: p, targetMonths: months })
    setEditing(false)
  }

  const showPicker = !goal || editing

  if (showPicker) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle">
            <Target className="h-5 w-5 text-brand" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-1)]">{t('hedef.title')}</h3>
            <p className="text-xs text-[var(--text-3)]">{t('hedef.subtitle')}</p>
          </div>
        </div>

        <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">{t('hedef.peopleLabel')}</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={people}
          onChange={e => setPeople(e.target.value)}
          placeholder={t('hedef.peoplePlaceholder')}
          className="mb-3 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-brand focus:ring-2 focus:ring-[#EEEDFE]"
        />

        <label className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">{t('hedef.monthsLabel')}</label>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {MONTH_OPTIONS.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                months === m
                  ? 'bg-brand text-white'
                  : 'border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
              )}
            >
              {t('hedef.monthsValue', { count: m })}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !people}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#453DA0] disabled:opacity-60"
          >
            {isSaving ? t('hedef.calculating') : t('hedef.calculate')}
            {!isSaving && <Rocket className="h-4 w-4" />}
          </button>
          {goal ? (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-subtle)]"
            >
              {t('common.cancel')}
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const p = progress

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3 sm:gap-3 sm:px-4">
        <p className="min-w-0 flex-1 truncate whitespace-nowrap text-[13px] font-semibold leading-none text-[var(--text-1)] sm:text-sm md:text-base md:font-medium">
          {t('hedef.myGoalStatement', {
            people: goal!.targetPeople,
            months: goal!.targetMonths,
          })}
        </p>
        <button
          type="button"
          onClick={() => {
            setPeople(String(goal!.targetPeople))
            setMonths(goal!.targetMonths)
            setEditing(true)
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
          aria-label={t('common.edit')}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </section>

      {p?.stage ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/50 px-3 py-2.5 text-xs font-medium leading-relaxed text-[var(--text-2)] sm:text-sm">
          {t('hedef.monthlyFocusLine', {
            arama: p.stage.monthly.arama,
            tanisma: p.stage.monthly.tanisma,
            sunum: p.stage.monthly.sunum,
            yeniUye: p.stage.monthly.yeniUye,
          })}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
          {t('hedef.todayTitle')}
        </h2>
        {/* Saha Özetim ile birebir aynı 4 kutu (format + renk); etiketler gelecek zaman (plan). */}
        <HubCrownFunnelGrid
          actuals={p?.actuals ?? EMPTY_FUNNEL}
          targets={p?.targets ?? EMPTY_FUNNEL}
          hasGoal={!!goal}
          period="daily"
          panoVariant
          hideFooter
          labelMode="plan"
        />
      </section>

      {roadmap.length > 0 ? (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setShowRoadmap(v => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <h2 className="text-base font-bold text-[var(--text-1)]">{t('hedef.roadmapTitle')}</h2>
            <ChevronDown className={clsx('h-5 w-5 shrink-0 text-[var(--text-3)] transition-transform', showRoadmap && 'rotate-180')} />
          </button>
          {showRoadmap ? (
            <ul className="space-y-2">
              {roadmap.map(s => {
                const isCurrent = p && s.month === p.monthIndex
                const isPast = p && s.month < p.monthIndex
                const isFuture = p && s.month > p.monthIndex
                const MemberIcon = FUNNEL_METRIC_VISUAL.yeniUye.Icon
                const monthOffset =
                  goal && (isPast || isCurrent)
                    ? calendarMonthOffsetForRoadmapMonth(goal.startAt, s.month)
                    : 0
                const monthlyHref =
                  monthOffset === 0
                    ? '/saha-ozetim?tab=monthly'
                    : `/saha-ozetim?tab=monthly&offset=${monthOffset}`
                const rowClass = clsx(
                  'block w-full rounded-xl border px-2.5 py-2.5 text-left transition',
                  isCurrent &&
                    'border-brand/40 bg-brand-subtle/50 shadow-sm dark:border-brand/45 dark:bg-[#1e1b4b]/55',
                  isPast &&
                    'border-emerald-200/80 bg-emerald-50/70 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:hover:border-emerald-700/60',
                  isFuture && 'border-[var(--border)] bg-[var(--bg-subtle)]/45 opacity-80',
                  !isCurrent && !isPast && !isFuture && 'border-[var(--border)] bg-[var(--bg-card)]',
                )
                const ariaLabel = isPast
                  ? t('hedef.roadmapMonthPast')
                  : isCurrent
                    ? t('hedef.roadmapMonthCurrent')
                    : isFuture
                      ? t('hedef.roadmapMonthFuture')
                      : undefined

                const rowBody = (
                  <div className="flex items-start gap-2 md:items-center">
                    <span
                      className={clsx(
                        'flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full text-base font-bold text-white',
                        isPast ? 'bg-emerald-500/90' : isFuture ? 'bg-[var(--text-3)]/50' : 'bg-[#F97316]',
                      )}
                    >
                      {s.month}
                    </span>
                    <div className="min-w-0 flex-1 md:flex md:items-center md:justify-between md:gap-3">
                      <span className="hidden min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--text-1)] md:block">
                        {t('hedef.roadmapTeamGoal', { n: s.teamSize })}
                      </span>
                      <div className="flex w-full min-w-0 items-center justify-between gap-1 md:contents">
                        <span className="shrink-0 font-semibold text-[var(--text-1)] md:hidden">
                          {t('hedef.roadmapTeamGoalMobile', { n: s.teamSize })}
                        </span>
                        <div className="flex shrink-0 flex-nowrap items-center gap-x-0.5 text-xs tabular-nums md:gap-x-1.5 md:text-sm">
                          <FunnelMetricCount
                            metric="arama"
                            value={s.monthly.arama}
                            iconClassName="h-3.5 w-3.5 md:h-4 md:w-4"
                            className="gap-0.5 md:gap-1"
                            vivid
                          />
                          <FunnelMetricCount
                            metric="tanisma"
                            value={s.monthly.tanisma}
                            iconClassName="h-3.5 w-3.5 md:h-4 md:w-4"
                            className="gap-0.5 md:gap-1"
                            vivid
                          />
                          <FunnelMetricCount
                            metric="sunum"
                            value={s.monthly.sunum}
                            iconClassName="h-3.5 w-3.5 md:h-4 md:w-4"
                            className="gap-0.5 md:gap-1"
                            vivid
                          />
                          <span className="shrink-0 text-[var(--text-3)]" aria-hidden>
                            ·
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap font-medium text-[var(--text-2)] md:gap-1">
                            <span className="md:hidden">{t('hedef.roadmapNewMembersMobile', { n: s.newMembers })}</span>
                            <span className="hidden md:inline">{t('hedef.roadmapNewMembers', { n: s.newMembers })}</span>
                            <MemberIcon
                              className={clsx('h-3.5 w-3.5 shrink-0 md:h-4 md:w-4', FUNNEL_METRIC_VIVID_CLASS.yeniUye)}
                              strokeWidth={2.25}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )

                if ((isPast || isCurrent) && goal) {
                  return (
                    <li key={s.month}>
                      <Link href={monthlyHref} className={rowClass} aria-label={ariaLabel}>
                        {rowBody}
                      </Link>
                    </li>
                  )
                }

                return (
                  <li key={s.month} className={rowClass} aria-label={ariaLabel}>
                    {rowBody}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
