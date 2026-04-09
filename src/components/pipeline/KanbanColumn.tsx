import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { STAGE_COLOR_CLASSES } from '@/lib/pipeline/constants'
import { resolveStageLabel } from '@/lib/pipeline/stageLabels'
import type { StageWithDeals } from '@/lib/pipeline/types'
import { DealCard } from './DealCard'

interface Props {
  stage: StageWithDeals
  isOver?: boolean
}

export function KanbanColumn({ stage, isOver }: Props) {
  const { t } = useTranslation()
  const colors = STAGE_COLOR_CLASSES[stage.color]

  const { setNodeRef } = useDroppable({ id: stage.id, data: { type: 'stage', stage } })

  const dealIds = stage.deals.map((d) => d.id)

  return (
    <div className="flex min-h-full w-[280px] shrink-0 flex-col">
      <div className={cn('rounded-t-lg border-t-4 px-3 py-2.5', colors.border, colors.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className={cn('text-sm font-semibold truncate', colors.text)}>
              {resolveStageLabel(stage, t)}
            </h3>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0', colors.badge)}>
              {stage.deals.length}
            </span>
          </div>
        </div>
      </div>

      {/* Drop area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[calc(100vh-15rem)] flex-1 flex-col rounded-b-lg border border-t-0 bg-muted/30 p-2.5 transition-colors',
          isOver && 'bg-primary/5 border-primary/30'
        )}
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          <div className="flex-1 space-y-2">
            {stage.deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </SortableContext>

        {stage.deals.length === 0 && (
          <div className="flex flex-1 items-center justify-center px-2 text-center text-xs text-muted-foreground/60">
            {t('pipeline.emptyColumn')}
          </div>
        )}
      </div>
    </div>
  )
}
