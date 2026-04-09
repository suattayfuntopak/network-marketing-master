import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStages, useDeals } from '@/hooks/usePipeline'
import type { StageWithDeals } from '@/lib/pipeline/types'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { PipelineTableView } from './PipelineTableView'
import { ManageStagesModal } from './modals/ManageStagesModal'

type ViewMode = 'kanban' | 'table'

export function PipelinePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const rawView = searchParams.get('view')
  const view: ViewMode = rawView === 'table' ? 'table' : 'kanban'
  const setView = (nextView: ViewMode) => {
    const params = new URLSearchParams(searchParams)
    params.set('view', nextView)
    setSearchParams(params)
  }

  const [showManageStages, setShowManageStages] = useState(false)

  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages(userId)
  const { data: deals = [], isLoading: dealsLoading } = useDeals(userId, { status: 'open' })
  const isLoading = stagesLoading || dealsLoading

  const stagesWithDeals: StageWithDeals[] = stages
    .filter((stage) => !stage.is_lost_stage)
    .map((stage) => {
      const stageDeals = deals
        .filter((deal) => deal.stage_id === stage.id)
        .sort((a, b) => a.position_in_stage - b.position_in_stage)

      return {
        ...stage,
        deals: stageDeals,
        totalValue: stageDeals.reduce((sum, deal) => sum + deal.value, 0),
        weightedValue: stageDeals.reduce((sum, deal) => sum + (deal.value * deal.probability) / 100, 0),
      }
    })

  const uniqueContactCount = useMemo(
    () => new Set(deals.map((deal) => deal.contact_id)).size,
    [deals]
  )

  const subtitle = `${uniqueContactCount} ${t(uniqueContactCount === 1 ? 'pipeline.contactSingular' : 'pipeline.contactPlural')}`

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4 p-6 pb-20 lg:pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('pipeline.title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border rounded-md overflow-hidden">
            {([
              { key: 'kanban', icon: LayoutGrid },
              { key: 'table', icon: List },
            ] as const).map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  'px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors',
                  view === key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(`pipeline.views.${key}`)}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowManageStages(true)}
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('pipeline.manageStages')}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'kanban' ? (
            <div className="h-full overflow-x-auto">
              <KanbanBoard stages={stagesWithDeals} userId={userId} />
            </div>
          ) : (
            <PipelineTableView deals={deals} stages={stages} />
          )}
        </div>
      )}

      <ManageStagesModal
        open={showManageStages}
        onClose={() => setShowManageStages(false)}
        userId={userId}
        stages={stages}
      />
    </div>
  )
}
