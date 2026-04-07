import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STAGE_COLOR_CLASSES } from '@/lib/pipeline/constants'
import type { StageWithDeals } from '@/lib/pipeline/types'
import { DealCard } from './DealCard'

interface Props {
  stage: StageWithDeals
  onAddDeal: (stageId: string) => void
  isOver?: boolean
}

export function KanbanColumn({ stage, onAddDeal, isOver }: Props) {
  const { t } = useTranslation()
  const colors = STAGE_COLOR_CLASSES[stage.color]

  const { setNodeRef } = useDroppable({ id: stage.id, data: { type: 'stage', stage } })

  const dealIds = stage.deals.map((d) => d.id)

  return (
    <div className="flex flex-col w-[200px] shrink-0">
      {/* Column header */}
      <div className={cn('rounded-t-lg border-t-4 px-3 py-2.5', colors.border, colors.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className={cn('text-sm font-semibold truncate', colors.text)}>
              {t(`pipelineStages.${stage.slug}`, { defaultValue: stage.name })}
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
          'flex-1 bg-muted/30 border border-t-0 rounded-b-lg p-2 min-h-[120px] transition-colors',
          isOver && 'bg-primary/5 border-primary/30'
        )}
      >
        <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {stage.deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </SortableContext>

        {stage.deals.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground/60 text-center px-2">
            {t('pipeline.emptyColumn')}
          </div>
        )}

        {/* Add deal button */}
        <button
          onClick={() => onAddDeal(stage.id)}
          className="w-full mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('pipeline.newDeal')}
        </button>
      </div>
    </div>
  )
}
