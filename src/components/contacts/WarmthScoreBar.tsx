import { getWarmthLabel, getWarmthGradient } from '@/lib/contacts/constants'
import { cn } from '@/lib/utils'

interface WarmthScoreBarProps {
  score: number
  showLabel?: boolean
  className?: string
}

export function WarmthScoreBar({ score, showLabel = true, className }: WarmthScoreBarProps) {
  const gradient = getWarmthGradient(score)
  const label = getWarmthLabel(score)

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
