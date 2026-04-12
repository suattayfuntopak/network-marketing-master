import { STAGE_COLORS } from '@/lib/contacts/constants'
import type { Contact } from '@/types/database'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const colorClasses: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

interface StageBadgeProps {
  stage: Contact['stage']
  label?: string
  className?: string
}

export function StageBadge({ stage, label, className }: StageBadgeProps) {
  const { t } = useTranslation()
  const color = STAGE_COLORS[stage]
  const displayLabel = label ?? t(`contactStages.${stage}`)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colorClasses[color],
        className
      )}
    >
      {displayLabel}
    </span>
  )
}
