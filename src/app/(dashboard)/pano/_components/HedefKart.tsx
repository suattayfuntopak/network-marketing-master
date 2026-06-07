'use client'

import { useState } from 'react'
import { Target, ChevronDown, Pencil, Rocket, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { useUserGoal } from '@/hooks/useUserGoal'
import { useTranslation } from '@/providers/LanguageProvider'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import {
  FUNNEL_METRIC_ORDER,
  FUNNEL_METRIC_VIVID_CLASS,
  FUNNEL_METRIC_VISUAL,
  FunnelMetricCount,
  FunnelMetricLabel,
} from '@/lib/ui/funnelMetricVisuals'

const MONTH_OPTIONS = [3, 6, 9, 12, 18, 24, 36]

const GOAL_ROW_LABELS: Record<keyof FunnelCounts, string> = {
  arama: 'hedef.dailyRowCalls',
  tanisma: 'hedef.dailyRowMeetings',
  sunum: 'hedef.dailyRowPresentations',
  yeniUye: 'hedef.dailyRowMembers',
}

const GOAL_ROWS = FUNNEL_METRIC_ORDER.map(key => ({ key, labelKey: GOAL_ROW_LABELS[key] }))

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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFE]">
            <Target className="h-5 w-5 text-[#534AB7]" strokeWidth={1.75} />
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
          className="mb-3 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
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
                  ? 'bg-[#534AB7] text-white'
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
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-2.5 text-sm font-semibold text-white hover:bg-[#453DA0] disabled:opacity-60"
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

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
          {t('hedef.todayTitle')}
        </h2>
        {GOAL_ROWS.map(row => {
          const target = p?.targets[row.key] ?? 0
          const actual = p?.actuals[row.key] ?? 0
          const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : actual > 0 ? 100 : 0
          const done = target > 0 && actual >= target
          const { barColor } = FUNNEL_METRIC_VISUAL[row.key]

          return (
            <div key={row.key} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <FunnelMetricLabel
                  metric={row.key}
                  label={t(row.labelKey)}
                  iconClassName="h-[18px] w-[18px]"
                  vivid
                  className="text-sm font-semibold leading-snug text-[var(--text-1)] md:text-base md:font-medium"
                />
                <span className={clsx('shrink-0 text-sm font-semibold tabular-nums', done ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-2)]')}>
                  {done ? <Check className="mr-0.5 inline h-3.5 w-3.5" /> : null}
                  {actual} / {target}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          )
        })}
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
                const MemberIcon = FUNNEL_METRIC_VISUAL.yeniUye.Icon
                return (
                  <li
                    key={s.month}
                    className={clsx(
                      'rounded-xl border px-2.5 py-2.5',
                      isCurrent
                        ? 'border-[#534AB7]/35 bg-[#EEEDFE]/40 dark:border-[#534AB7]/40 dark:bg-[#1e1b4b]/50'
                        : 'border-[var(--border)] bg-[var(--bg-card)]',
                    )}
                  >
                    <div className="flex items-start gap-2 md:items-center">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-[#F97316] text-base font-bold text-white">
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
