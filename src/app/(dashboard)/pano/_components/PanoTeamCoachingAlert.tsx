'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { buildCoachingAlerts, coachingAlertSummary } from '@/lib/domain/teamCoaching'
import { PersonAvatar } from '@/components/ui/PersonAvatar'

const PANO_PREVIEW_LIMIT = 3

export function PanoTeamCoachingAlert() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const { data: members = [] } = useEkipPanelRows(ws?.workspaceId)

  const alert = useMemo(() => {
    if (!ws || !hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) return null

    const entries = buildCoachingAlerts(members)
    if (entries.length === 0) return null

    const summary = coachingAlertSummary(entries)
    const reasons: string[] = []
    if (summary.inactiveCount > 0) {
      reasons.push(t('dashboard.coachingReasonInactive', { count: summary.inactiveCount }))
    } else if (summary.lowOnboardingCount > 0) {
      reasons.push(t('dashboard.coachingReasonOnboarding', { count: summary.lowOnboardingCount }))
    }

    return {
      entries,
      preview: entries.slice(0, PANO_PREVIEW_LIMIT),
      summary,
      reasons,
    }
  }, [ws, members, t])

  if (!alert) return null

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/25 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-1)]">
            {t('dashboard.teamCoachingAlert', { count: alert.summary.total })}
          </p>
          <ul className="mt-1 space-y-0.5">
            {alert.reasons.map((line, i) => (
              <li key={i} className="text-xs text-[var(--text-2)]">· {line}</li>
            ))}
          </ul>
        </div>
      </div>

      <ul className="space-y-1.5">
        {alert.preview.map(({ member, flag, daysInactive }) => {
          const name = member.full_name ?? t('statsPage.unnamedMember')
          const flagLabel =
            flag === 'inactive'
              ? t('dashboard.coachingFlagInactive', { days: daysInactive >= 999 ? '7+' : daysInactive })
              : t('dashboard.coachingFlagOnboarding')

          return (
            <li key={member.user_id}>
              <Link
                href={`/ekip?activity=${member.user_id}`}
                className="flex items-center gap-3 rounded-xl border border-amber-500/15 bg-[var(--bg-card)]/80 px-3 py-2.5 transition hover:border-amber-500/35 active:scale-[0.99]"
              >
                <PersonAvatar name={member.full_name ?? name} imageUrl={member.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-1)]">{name}</p>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">{flagLabel}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
              </Link>
            </li>
          )
        })}
      </ul>

      <Link
        href="/ekip"
        className="flex w-full items-center justify-center gap-1 rounded-xl border border-amber-600/25 bg-amber-100/60 dark:bg-amber-950/40 py-2.5 text-xs font-bold text-amber-800 dark:text-amber-300 transition hover:bg-amber-100 dark:hover:bg-amber-950/60"
      >
        {t('dashboard.coachingSeeAll')}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
