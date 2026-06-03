'use client'

import { useQuery } from '@tanstack/react-query'
import { X, Check, Flame } from 'lucide-react'
import { Z } from '@/lib/ui/zIndex'
import { useTranslation } from '@/providers/LanguageProvider'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { getFieldStreakDetailAction } from '@/app/(dashboard)/pano/myPulseActions'
import { renderActivityText } from '@/app/(dashboard)/pipeline/[id]/_components/candidateDetailUtils'
import { Skeleton } from '@/components/ui/Skeleton'

type Props = {
  workspaceId: string
  onClose: () => void
}

function formatDayLabel(dayKey: string, lang: 'tr' | 'en'): string {
  const d = new Date(`${dayKey}T12:00:00`)
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(iso: string, lang: 'tr' | 'en'): string {
  const d = new Date(iso)
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

export function FieldStreakDetailModal({ workspaceId, onClose }: Props) {
  const { lang, t } = useTranslation()
  useBodyScrollLock(true)

  const { data, isLoading } = useQuery({
    queryKey: ['field-streak-detail', workspaceId],
    queryFn: () => getFieldStreakDetailAction(workspaceId),
    staleTime: 15_000,
  })

  return (
    <div
      className={`fixed inset-0 ${Z.confirm} flex items-center justify-center bg-black/55 backdrop-blur-sm p-4`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Flame className="h-5 w-5 shrink-0 text-orange-500" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[var(--text-1)]">
                {t('pulse.fieldStreakDetailTitle')}
              </h3>
              {data && (
                <p className="text-xs text-[var(--text-3)]">
                  {t('pulse.fieldStreakDetailSubtitle', { active: data.activeDays })}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
            aria-label={t('pulse.fieldStreakClose')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </>
          )}

          {!isLoading && data?.days.map(day => (
            <div
              key={day.dayKey}
              className={`rounded-xl border px-3 py-2.5 ${
                day.active
                  ? 'border-orange-400/30 bg-orange-50/50 dark:bg-orange-950/15'
                  : 'border-[var(--border)] bg-[var(--bg-subtle)]/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-sm font-bold text-[var(--text-1)]">
                  {formatDayLabel(day.dayKey, lang)}
                </p>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    day.active
                      ? 'bg-orange-500 text-white'
                      : 'border border-[var(--border)] text-[var(--text-3)]'
                  }`}
                >
                  {day.active && <Check className="h-3 w-3" />}
                </span>
              </div>

              {day.actions.length === 0 ? (
                <p className="text-xs text-[var(--text-3)]">{t('pulse.fieldStreakNoActionsDay')}</p>
              ) : (
                <ul className="space-y-1.5">
                  {day.actions.map(action => (
                    <li
                      key={action.id}
                      className="flex items-start justify-between gap-2 text-xs text-[var(--text-2)]"
                    >
                      <span className="min-w-0">
                        {renderActivityText(action, lang, t)}
                        {action.candidate_name && (
                          <span className="text-[var(--text-3)]"> · {action.candidate_name}</span>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums text-[var(--text-3)]">
                        {formatTime(action.created_at, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--border)] px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
          >
            {t('pulse.fieldStreakClose')}
          </button>
        </div>
      </div>
    </div>
  )
}
