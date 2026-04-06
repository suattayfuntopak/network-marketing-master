import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Settings2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStages, useDeals } from '@/hooks/usePipeline'
import type { StageWithDeals, DealFilters, DealType } from '@/lib/pipeline/types'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { PipelineTableView } from './PipelineTableView'
import { NewDealModal } from './modals/NewDealModal'
import { ManageStagesModal } from './modals/ManageStagesModal'

type ViewMode = 'kanban' | 'table'

export function PipelinePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [searchParams, setSearchParams] = useSearchParams()

  const view = (searchParams.get('view') as ViewMode) ?? 'kanban'
  const setView = (v: ViewMode) => {
    const params = new URLSearchParams(searchParams)
    params.set('view', v)
    setSearchParams(params)
  }

  const filterDealType = (searchParams.get('type') as DealType) ?? undefined
  const filterStatus = searchParams.get('status') ?? undefined

  const [showNewDeal, setShowNewDeal] = useState(false)
  const [showManageStages, setShowManageStages] = useState(false)
  const [newDealStageId, setNewDealStageId] = useState<string | undefined>()

  const filters: DealFilters = {
    dealType: filterDealType || null,
    status: (filterStatus as DealFilters['status']) ?? (view === 'kanban' ? 'open' : null),
  }

  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages(userId)
  const { data: deals = [], isLoading: dealsLoading } = useDeals(userId, filters)

  const isLoading = stagesLoading || dealsLoading

  // Build StageWithDeals for Kanban
  const stagesWithDeals: StageWithDeals[] = stages
    .filter((s) => !s.is_lost_stage || view !== 'kanban')
    .map((stage) => {
      const stageDeals = deals
        .filter((d) => d.stage_id === stage.id)
        .sort((a, b) => a.position_in_stage - b.position_in_stage)
      const totalValue = stageDeals.reduce((s, d) => s + d.value, 0)
      const weightedValue = stageDeals.reduce((s, d) => s + (d.value * d.probability) / 100, 0)
      return { ...stage, deals: stageDeals, totalValue, weightedValue }
    })

  const handleAddDeal = (stageId: string) => {
    setNewDealStageId(stageId)
    setShowNewDeal(true)
  }

  return (
    <div className="flex flex-col h-full min-h-0 p-6 pb-20 lg:pb-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('pipeline.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {deals.length > 0 ? `${deals.length} deal` : t('pipeline.emptyColumn')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
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

          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => { setNewDealStageId(undefined); setShowNewDeal(true) }}
          >
            <Plus className="w-4 h-4" />
            {t('pipeline.newDeal')}
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'kanban' && (
            <div className="h-full overflow-x-auto">
              <KanbanBoard
                stages={stagesWithDeals}
                userId={userId}
                onAddDeal={handleAddDeal}
              />
            </div>
          )}
          {view === 'table' && <PipelineTableView deals={deals} stages={stages} />}
        </div>
      )}

      {/* Modals */}
      <NewDealModal
        open={showNewDeal}
        onClose={() => setShowNewDeal(false)}
        userId={userId}
        stages={stages}
        defaultStageId={newDealStageId}
      />
      <ManageStagesModal
        open={showManageStages}
        onClose={() => setShowManageStages(false)}
        userId={userId}
        stages={stages}
      />
    </div>
  )
}
