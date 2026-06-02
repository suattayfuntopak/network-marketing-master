'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'

export function PanoTeamCoachingAlert() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const { data: members = [] } = useTeamMembers(ws?.workspaceId)

  const alert = useMemo(() => {
    if (!ws || !hasTeamPageAccess(ws.licenseType, ws.isSuperAdmin)) return null

    const downlines = members.filter(m => m.role === 'member')
    if (downlines.length === 0) return null

    const now = Date.now()
    const inactive = downlines.filter(m => {
      if (!m.last_activity_at) return true
      const days = (now - new Date(m.last_activity_at).getTime()) / 86_400_000
      return days >= 7
    }).length

    const lowOnboarding = downlines.filter(m => (m.onboarding_steps?.length ?? 0) < 2).length

    const reasons: string[] = []
    if (inactive > 0) {
      reasons.push(t('dashboard.coachingReasonInactive', { count: inactive }))
    }
    if (lowOnboarding > 0 && inactive === 0) {
      reasons.push(t('dashboard.coachingReasonOnboarding', { count: lowOnboarding }))
    }

    const total = inactive > 0 ? inactive : lowOnboarding > 0 ? lowOnboarding : 0
    if (total === 0) return null

    return { total, reasons: reasons.slice(0, 2) }
  }, [ws, members, t])

  if (!alert) return null

  return (
    <Link
      href="/istatistikler#team-performance"
      className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/25 p-4 transition hover:border-amber-500/50 active:scale-[0.99]"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[var(--text-1)]">
          {t('dashboard.teamCoachingAlert', { count: alert.total })}
        </p>
        <ul className="mt-1 space-y-0.5">
          {alert.reasons.map((line, i) => (
            <li key={i} className="text-xs text-[var(--text-2)]">· {line}</li>
          ))}
        </ul>
      </div>
      <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
        {t('dashboard.coachingDetail')}
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  )
}
