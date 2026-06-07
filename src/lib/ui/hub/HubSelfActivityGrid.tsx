'use client'

import Link from 'next/link'
import { Sparkles, Pencil, ArrowRight, CalendarDays, Activity, MessageCircle } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import type { HubSelfFieldMetrics } from '@/app/(dashboard)/crown/actions'

type HubSelfActivityGridProps = {
  metrics: HubSelfFieldMetrics
  loading?: boolean
}

type ActivityItem = {
  id: string
  icon: typeof Sparkles
  label: string
  value: number
  color: string
  href: string
  isWa?: boolean
}

/** Üst huni kutularında olmayan saha metrikleri (arama & yeni aday hariç). */
export function HubSelfActivityGrid({ metrics, loading }: HubSelfActivityGridProps) {
  const { t } = useTranslation()

  const items: ActivityItem[] = [
    {
      id: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      value: metrics.whatsapps,
      color: 'text-[#128C7E]',
      href: '/bugunku-takibim',
      isWa: true,
    },
    {
      id: 'notes',
      icon: Pencil,
      label: t('team.activityNotes'),
      value: metrics.notes,
      color: 'text-[var(--text-2)]',
      href: '/bugunku-takibim',
    },
    {
      id: 'stage',
      icon: ArrowRight,
      label: t('team.activityStageChanges'),
      value: metrics.stageChanges,
      color: 'text-amber-600 dark:text-amber-400',
      href: '/pipeline',
    },
    {
      id: 'ai',
      icon: Sparkles,
      label: t('team.activityAi'),
      value: metrics.aiActions,
      color: 'text-indigo-600 dark:text-indigo-400',
      href: '/yazar',
    },
    {
      id: 'active',
      icon: CalendarDays,
      label: t('team.activityActiveDays'),
      value: metrics.activeDays,
      color: 'text-[var(--text-2)]',
      href: '/bugunku-takibim',
    },
    {
      id: 'total',
      icon: Activity,
      label: t('team.activityTotalActions'),
      value: metrics.totalActions,
      color: 'text-brand',
      href: '/istatistikler',
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
        {items.map(({ id, icon: Icon, label, value, color, href, isWa }) => (
          <Link
            key={id}
            href={href}
            className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 transition hover:border-brand/35 hover:bg-[var(--bg-subtle)]/60"
          >
            <div className="mb-1 flex items-center gap-1.5">
              {isWa ? (
                <WhatsAppIcon className={`h-4 w-4 shrink-0 ${color}`} />
              ) : (
                <Icon className={`h-4 w-4 shrink-0 ${color}`} strokeWidth={2.25} />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)] group-hover:text-[var(--text-2)]">
                {label}
              </span>
            </div>
            <p className="text-xl font-black tabular-nums text-[var(--text-1)]">{value}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
