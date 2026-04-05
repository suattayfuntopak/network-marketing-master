import { getWarmthKey, getWarmthGradient } from '@/lib/contacts/constants'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface WarmthScoreBarProps {
  score: number
  showLabel?: boolean
  className?: string
}

export function WarmthScoreBar({ score, showLabel = true, className }: WarmthScoreBarProps) {
  const { t } = useTranslation()
  const gradient = getWarmthGradient(score)
  const label = t(`contactWarmth.${getWarmthKey(score)}`)

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium tabular-nums">{score}</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-300', gradient)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
