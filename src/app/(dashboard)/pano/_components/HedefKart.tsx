'use client'

import { useState } from 'react'
import { Target, ChevronDown, Pencil, Rocket, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { useUserGoal } from '@/hooks/useUserGoal'
import { useTranslation } from '@/providers/LanguageProvider'
import type { FunnelCounts } from '@/lib/domain/roadmap'

const MONTH_OPTIONS = [3, 6, 9, 12, 18, 24, 36]

const FUNNEL_ROWS: { key: keyof FunnelCounts; color: string }[] = [
  { key: 'arama', color: '#534AB7' },
  { key: 'tanisma', color: '#0F6E56' },
  { key: 'sunum', color: '#854F0B' },
  { key: 'yeniUye', color: '#72243E' },
]

export function HedefKart() {
  const { t } = useTranslation()
  const { goal, progress, roadmap, isLoading, saveGoal, isSaving } = useUserGoal()
  const [editing, setEditing] = useState(false)
  const [people, setPeople] = useState('')
  const [months, setMonths] = useState(12)
  const [showRoadmap, setShowRoadmap] = useState(false)

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

  // ── Hedef belirleme / düzenleme ──
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
          onChange={(e) => setPeople(e.target.value)}
          placeholder={t('hedef.peoplePlaceholder')}
          className="mb-3 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
        />

        <label className="mb-1.5 block text-xs font-semibold text-[var(--text-2)]">{t('hedef.monthsLabel')}</label>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {MONTH_OPTIONS.map((m) => (
            <button
              key={m}
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
            onClick={handleSave}
            disabled={isSaving || !people}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-2.5 text-sm font-semibold text-white hover:bg-[#453DA0] disabled:opacity-60"
          >
            {isSaving ? t('hedef.calculating') : t('hedef.calculate')}
            {!isSaving && <Rocket className="h-4 w-4" />}
          </button>
          {goal && (
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-subtle)]"
            >
              {t('common.cancel')}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Günlük takip + yol haritası ──
  const p = progress
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFE]">
            <Target className="h-5 w-5 text-[#534AB7]" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-1)]">
              {t('hedef.goalSummary', { people: goal!.targetPeople, months: goal!.targetMonths })}
            </h3>
            {p && (
              <p className="text-xs text-[var(--text-3)]">
                {t('hedef.monthProgress', { current: p.monthIndex, total: p.totalMonths, team: p.teamSize, target: p.targetTeamSize })}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => { setPeople(String(goal!.targetPeople)); setMonths(goal!.targetMonths); setEditing(true) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
          aria-label={t('common.edit')}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {/* Bugünün huni hedefleri vs gerçekleşen */}
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">{t('hedef.todayTitle')}</p>
      <div className="space-y-2.5">
        {FUNNEL_ROWS.map(({ key, color }) => {
          const target = p?.targets[key] ?? 0
          const actual = p?.actuals[key] ?? 0
          const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : actual > 0 ? 100 : 0
          const done = target > 0 && actual >= target
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--text-1)]">{t(`hedef.${key}`)}</span>
                <span className={clsx('font-semibold', done ? 'text-[#0F6E56]' : 'text-[var(--text-2)]')}>
                  {done && <Check className="mr-0.5 inline h-3 w-3" />}
                  {actual} / {target}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Yol haritası (açılır) */}
      {roadmap.length > 0 && (
        <>
          <button
            onClick={() => setShowRoadmap((v) => !v)}
            className="mt-4 flex w-full items-center justify-between rounded-xl bg-[var(--bg-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--border)]"
          >
            {t('hedef.roadmapTitle')}
            <ChevronDown className={clsx('h-4 w-4 transition-transform', showRoadmap && 'rotate-180')} />
          </button>
          {showRoadmap && (
            <ul className="mt-2 space-y-1.5">
              {roadmap.map((s) => (
                <li
                  key={s.month}
                  className={clsx(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-xs',
                    p && s.month === p.monthIndex
                      ? 'border border-[#534AB7]/30 bg-[#EEEDFE]/50'
                      : 'bg-[var(--bg-subtle)]',
                  )}
                >
                  <span className="font-semibold text-[var(--text-1)]">
                    {t('hedef.monthN', { n: s.month })} · {t('hedef.teamN', { n: s.teamSize })}
                  </span>
                  <span className="text-[var(--text-3)]">
                    +{s.newMembers} · {s.monthly.arama}/{s.monthly.tanisma}/{s.monthly.sunum}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
