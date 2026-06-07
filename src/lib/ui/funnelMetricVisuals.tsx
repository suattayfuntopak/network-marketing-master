import { Handshake, Phone, Presentation, UserPlus, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import type { FunnelCounts } from '@/lib/domain/roadmap'

export type FunnelMetricKey = keyof FunnelCounts

export const FUNNEL_METRIC_VISUAL: Record<
  FunnelMetricKey,
  { Icon: LucideIcon; color: string; barColor: string }
> = {
  arama: { Icon: Phone, color: '#534AB7', barColor: '#534AB7' },
  tanisma: { Icon: Handshake, color: '#0F6E56', barColor: '#0F6E56' },
  sunum: { Icon: Presentation, color: '#854F0B', barColor: '#854F0B' },
  yeniUye: { Icon: UserPlus, color: '#72243E', barColor: '#72243E' },
}

export const FUNNEL_METRIC_ORDER: FunnelMetricKey[] = ['arama', 'tanisma', 'sunum', 'yeniUye']

type FunnelMetricLabelProps = {
  metric: FunnelMetricKey
  label: string
  iconClassName?: string
  className?: string
}

export function FunnelMetricLabel({ metric, label, iconClassName = 'h-4 w-4', className }: FunnelMetricLabelProps) {
  const { Icon, color } = FUNNEL_METRIC_VISUAL[metric]
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <Icon className={clsx('shrink-0', iconClassName)} style={{ color }} strokeWidth={2} />
      <span>{label}</span>
    </span>
  )
}

type FunnelMetricCountProps = {
  metric: FunnelMetricKey
  value: number
  iconClassName?: string
}

export function FunnelMetricCount({ metric, value, iconClassName = 'h-3 w-3' }: FunnelMetricCountProps) {
  const { Icon, color } = FUNNEL_METRIC_VISUAL[metric]
  return (
    <span className="inline-flex items-center gap-1 tabular-nums text-[var(--text-3)]">
      <Icon className={clsx('shrink-0', iconClassName)} style={{ color }} strokeWidth={2} />
      {value}
    </span>
  )
}
