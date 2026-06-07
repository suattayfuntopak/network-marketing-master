'use client'

import {
  Phone, Bot, Pencil, ArrowRight, UserPlus, CalendarDays, Activity,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import type { HubSelfFieldMetrics } from '@/app/(dashboard)/crown/actions'

type HubSelfActivityGridProps = {
  metrics: HubSelfFieldMetrics
  loading?: boolean
}

export function HubSelfActivityGrid({ metrics, loading }: HubSelfActivityGridProps) {
  const { t } = useTranslation()

  const items = [
    { icon: Phone, label: t('pulse.calls'), value: metrics.calls, color: 'text-blue-600 dark:text-blue-400' },
    { icon: WhatsAppIcon, label: 'WhatsApp', value: metrics.whatsapps, color: 'text-[#128C7E]', isWa: true },
    { icon: Pencil, label: t('team.activityNotes'), value: metrics.notes, color: 'text-[var(--text-2)]' },
    { icon: ArrowRight, label: t('team.activityStageChanges'), value: metrics.stageChanges, color: 'text-amber-600 dark:text-amber-400' },
    { icon: Bot, label: t('team.activityAi'), value: metrics.aiActions, color: 'text-indigo-600 dark:text-indigo-400' },
    { icon: UserPlus, label: t('team.activityNewLeads'), value: metrics.newCandidates, color: 'text-emerald-600 dark:text-emerald-400' },
    { icon: CalendarDays, label: t('team.activityActiveDays'), value: metrics.activeDays, color: 'text-[var(--text-2)]' },
    { icon: Activity, label: t('team.activityTotalActions'), value: metrics.totalActions, color: 'text-brand' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
        {t('crown.hubActivityTitle')}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ icon: Icon, label, value, color, isWa }) => (
          <div
            key={label}
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5"
          >
            <div className="mb-1 flex items-center gap-1.5">
              {isWa ? (
                <WhatsAppIcon className={`h-4 w-4 shrink-0 ${color}`} />
              ) : (
                <Icon className={`h-4 w-4 shrink-0 ${color}`} strokeWidth={2.25} />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">{label}</span>
            </div>
            <p className="text-xl font-black tabular-nums text-[var(--text-1)]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
