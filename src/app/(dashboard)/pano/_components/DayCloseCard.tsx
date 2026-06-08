'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Moon } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useUserGoal } from '@/hooks/useUserGoal'
import { useCandidates } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { readDayClosed, readDayNote, writeDayClosed } from '@/lib/domain/dayRitual'

export function DayCloseCard() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const { progress, isLoading: goalLoading } = useUserGoal()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const { daily, remaining } = useDailyActions(candidates)
  const [closed, setClosed] = useState(false)
  const [note, setNote] = useState('')
  const [hydrated, setHydrated] = useState(false)

  const userId = ws?.userId ?? ws?.workspaceId

  useEffect(() => {
    if (!userId) return
    setClosed(readDayClosed(userId))
    setNote(readDayNote(userId))
    setHydrated(true)
  }, [userId])

  const metrics = useMemo(() => {
    const a = progress?.actuals
    return [
      { label: t('dashboard.dayCloseCalls'), value: a?.arama ?? 0 },
      { label: t('dashboard.dayCloseContacts'), value: a?.tanisma ?? 0 },
      { label: t('dashboard.dayClosePresentations'), value: a?.sunum ?? 0 },
      { label: t('dashboard.dayCloseMembers'), value: a?.yeniUye ?? 0 },
    ]
  }, [progress?.actuals, t])

  if (!hydrated || !userId || goalLoading || cLoading) return null

  function handleClose() {
    if (!userId) return
    writeDayClosed(userId, note)
    setClosed(true)
  }

  if (closed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
        <p className="text-sm font-semibold text-[var(--text-1)]">{t('dashboard.dayCloseDone')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEEDFE] dark:bg-[#2d2a5e]">
          <Moon className="h-5 w-5 text-[#534AB7] dark:text-[#a09be8]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[var(--text-1)]">{t('dashboard.dayCloseTitle')}</h3>
          <p className="mt-0.5 text-xs text-[var(--text-3)]">{t('dashboard.dayCloseSubtitle')}</p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map(row => (
          <div
            key={row.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/60 px-2 py-2 text-center"
          >
            <p className="text-lg font-bold tabular-nums text-[var(--text-1)]">{row.value}</p>
            <p className="text-[10px] font-medium text-[var(--text-3)]">{row.label}</p>
          </div>
        ))}
      </div>

      {(daily.length > 0 || remaining > 0) && (
        <p className="mb-3 text-xs text-[var(--text-2)]">
          {t('dashboard.dayClosePending', { count: daily.length + remaining })}
          {' — '}
          <Link href="/bugunku-takibim" className="font-semibold text-[#534AB7] hover:underline">
            {t('dashboard.seeAll')}
          </Link>
        </p>
      )}

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={2}
        placeholder={t('dashboard.dayCloseNotePlaceholder')}
        className="mb-3 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)] focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
      />

      <button
        type="button"
        onClick={handleClose}
        className={clsx(
          'w-full rounded-xl bg-[#534AB7] py-2.5 text-sm font-bold text-white transition hover:bg-[#453DA0] active:scale-[0.99]',
        )}
      >
        {t('dashboard.dayCloseButton')}
      </button>

      <p className="mt-3 text-center text-xs text-[var(--text-3)]">
        <Link href="/pano#journal" className="font-medium text-[#534AB7] hover:underline">
          {t('dashboard.dayCloseJournalLink')}
        </Link>
      </p>
    </div>
  )
}
