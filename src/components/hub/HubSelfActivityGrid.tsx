'use client'

import { clsx } from 'clsx'
import { Sparkles, Pencil, ArrowRight, CalendarDays, Activity, MessageCircle } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import type { HubSelfFieldMetrics } from '@/app/(dashboard)/crown/hubSelfActions'
import { crownSolidMap } from '@/components/ui/SquareButton'
import { HUB_ACTIVITY_PANO_COLOR } from '@/lib/ui/hubPanoMetricColors'

type HubSelfActivityGridProps = {
  metrics: HubSelfFieldMetrics
  loading?: boolean
  /** Saha Özetim: pano crown gradient kutular */
  panoVariant?: boolean
}

type ActivityItem = {
  id: string
  icon: typeof Sparkles
  label: string
  value: number
  color: string
  isWa?: boolean
}

/** Üst huni kutularında olmayan saha metrikleri (tıklanabilir değil). */
export function HubSelfActivityGrid({ metrics, loading, panoVariant = false }: HubSelfActivityGridProps) {
  const { t } = useTranslation()

  const items: ActivityItem[] = [
    {
      id: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      value: metrics.whatsapps,
      color: 'text-[#128C7E]',
      isWa: true,
    },
    {
      id: 'notes',
      icon: Pencil,
      label: t('team.activityNotes'),
      value: metrics.notes,
      color: 'text-[var(--text-2)]',
    },
    {
      id: 'stage',
      icon: ArrowRight,
      label: t('team.activityStageChanges'),
      value: metrics.stageChanges,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'ai',
      icon: Sparkles,
      label: t('team.activityAi'),
      value: metrics.aiActions,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'active',
      icon: CalendarDays,
      label: t('team.activityActiveDays'),
      value: metrics.activeDays,
      color: 'text-[var(--text-2)]',
    },
    {
      id: 'total',
      icon: Activity,
      label: t('team.activityTotalActions'),
      value: metrics.totalActions,
      color: 'text-brand',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="text-base font-bold text-[var(--text-1)]">{t('crown.hubActivityTitle')}</h2>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ id, icon: Icon, label, value, color, isWa }) => {
          const panoColor = HUB_ACTIVITY_PANO_COLOR[id as keyof typeof HUB_ACTIVITY_PANO_COLOR]
          return (
            <div
              key={id}
              className={clsx(
                'flex flex-col rounded-xl px-3 py-2.5',
                panoVariant
                  ? clsx(crownSolidMap[panoColor], 'border border-white/20 text-white shadow-md')
                  : 'border border-[var(--border)] bg-[var(--bg-card)]',
              )}
            >
              <div className="mb-1 flex items-center gap-1.5">
                {isWa ? (
                  <WhatsAppIcon
                    className={clsx('h-4 w-4 shrink-0', panoVariant ? 'text-white' : color)}
                  />
                ) : (
                  <Icon
                    className={clsx('h-4 w-4 shrink-0', panoVariant ? 'text-white' : color)}
                    strokeWidth={2.25}
                  />
                )}
                <span
                  className={clsx(
                    'text-[10px] font-bold uppercase tracking-wide',
                    panoVariant ? 'text-white/80' : 'text-[var(--text-3)]',
                  )}
                >
                  {label}
                </span>
              </div>
              <p
                className={clsx(
                  'text-xl font-black tabular-nums',
                  panoVariant ? 'text-white' : 'text-[var(--text-1)]',
                )}
              >
                {value}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
