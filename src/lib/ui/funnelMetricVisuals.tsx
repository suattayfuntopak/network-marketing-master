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

/** Hedefim sayfası — dark temada da okunur pastel/vivid ikon renkleri */
export const FUNNEL_METRIC_VIVID_CLASS: Record<FunnelMetricKey, string> = {
  arama: 'text-emerald-600 dark:text-emerald-400',
  tanisma: 'text-sky-500 dark:text-sky-300',
  sunum: 'text-violet-500 dark:text-violet-300',
  yeniUye: 'text-amber-500 dark:text-amber-400',
}

type FunnelMetricLabelProps = {
  metric: FunnelMetricKey
  label: string
  iconClassName?: string
  className?: string
  /** Hedefim gibi sayfalarda dark-safe vivid renkler */
  vivid?: boolean
}

export function FunnelMetricLabel({
  metric,
  label,
  iconClassName = 'h-4 w-4',
  className,
  vivid = false,
}: FunnelMetricLabelProps) {
  const { Icon, color } = FUNNEL_METRIC_VISUAL[metric]
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <Icon
        className={clsx('shrink-0', iconClassName, vivid && FUNNEL_METRIC_VIVID_CLASS[metric])}
        style={vivid ? undefined : { color }}
        strokeWidth={2.25}
      />
      <span>{label}</span>
    </span>
  )
}

type FunnelMetricCountProps = {
  metric: FunnelMetricKey
  value: number
  iconClassName?: string
  className?: string
  vivid?: boolean
}

export function FunnelMetricCount({
  metric,
  value,
  iconClassName = 'h-3 w-3',
  className,
  vivid = false,
}: FunnelMetricCountProps) {
  const { Icon, color } = FUNNEL_METRIC_VISUAL[metric]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 tabular-nums',
        vivid ? 'text-sm font-medium text-[var(--text-2)]' : 'text-[var(--text-3)]',
        className,
      )}
    >
      <Icon
        className={clsx('shrink-0', iconClassName, vivid && FUNNEL_METRIC_VIVID_CLASS[metric])}
        style={vivid ? undefined : { color }}
        strokeWidth={2.25}
      />
      {value}
    </span>
  )
}
