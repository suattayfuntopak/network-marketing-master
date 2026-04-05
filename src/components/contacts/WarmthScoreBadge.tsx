import { getWarmthKey, getWarmthColor } from '@/lib/contacts/constants'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const colorClasses: Record<string, string> = {
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

interface WarmthScoreBadgeProps {
  score: number
  className?: string
}

export function WarmthScoreBadge({ score, className }: WarmthScoreBadgeProps) {
  const { t } = useTranslation()
  const color = getWarmthColor(score)
  const label = t(`contactWarmth.${getWarmthKey(score)}`)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        colorClasses[color],
        className
      )}
    >
      <span className="tabular-nums">{score}</span>
      <span>· {label}</span>
    </span>
  )
}
