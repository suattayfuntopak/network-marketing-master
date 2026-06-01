'use client'

import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getPulseWeeklyInsightAction } from '@/app/(dashboard)/pulse/insightActions'
import { Skeleton } from '@/components/ui/Skeleton'

type Props = {
  scope: 'personal' | 'team'
  comfortableTypography?: boolean
}

const RISK_KEYS: Record<string, string> = {
  inactive: 'pulse.aiRiskInactive',
  low_training: 'pulse.aiRiskLowTraining',
  objections_gap: 'pulse.aiRiskObjectionsGap',
  low_field: 'pulse.aiRiskLowField',
  video_dropoff: 'pulse.aiRiskVideoDropoff',
  team_inactive: 'pulse.aiRiskTeamInactive',
}

function riskFlagLabel(t: (key: string) => string, flag: string): string {
  const key = RISK_KEYS[flag]
  return key ? t(key) : flag
}

export function PulseAiInsight({ scope, comfortableTypography = false }: Props) {
  const { t, lang } = useTranslation()
  const { data: ws } = useWorkspace()

  const { data, isLoading } = useQuery({
    queryKey: ['pulse-insight', ws?.workspaceId, scope, lang],
    queryFn: () =>
      getPulseWeeklyInsightAction(ws!.workspaceId, scope, lang === 'en' ? 'en' : 'tr'),
    enabled: !!ws?.workspaceId,
    staleTime: 60_000,
  })

  if (!ws?.workspaceId) return null
  if (isLoading) return <Skeleton className="h-24 rounded-xl" />
  if (!data) return null

  return (
    <div className="rounded-xl border border-brand/20 bg-gradient-to-br from-brand/5 to-transparent p-4 space-y-2">
      <div
        className={`flex items-center gap-2 font-bold text-brand ${comfortableTypography ? 'text-sm' : 'text-xs'}`}
      >
        <Sparkles className="h-4 w-4" />
        {scope === 'team' ? t('pulse.aiTeamTitle') : t('pulse.aiPersonalTitle')}
      </div>
      <p
        className={`leading-relaxed text-[var(--text-2)] ${comfortableTypography ? 'text-sm' : 'text-xs'}`}
      >
        {data.summary}
      </p>
      {data.bullets.length > 0 && (
        <ul
          className={`list-disc pl-4 space-y-1 text-[var(--text-2)] ${comfortableTypography ? 'text-sm' : 'text-[11px]'}`}
        >
          {data.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {data.riskFlags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {data.riskFlags.map(flag => (
            <span
              key={flag}
              className={`rounded-md bg-rose-500/10 px-1.5 py-0.5 font-bold text-rose-700 dark:text-rose-300 ${comfortableTypography ? 'text-[11px]' : 'text-[9px]'}`}
            >
              {riskFlagLabel(t, flag)}
            </span>
          ))}
        </div>
      )}
      <p className={`text-[var(--text-3)] ${comfortableTypography ? 'text-[11px]' : 'text-[9px]'}`}>
        {t('pulse.aiWeekNote', { week: data.weekStart })}
      </p>
    </div>
  )
}
