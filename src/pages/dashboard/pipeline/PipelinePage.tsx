import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, LayoutGrid, List, Settings2, Target, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStages, useDeals } from '@/hooks/usePipeline'
import type { StageWithDeals } from '@/lib/pipeline/types'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { PipelineTableView } from './PipelineTableView'
import { NewDealModal } from './modals/NewDealModal'
import { ManageStagesModal } from './modals/ManageStagesModal'
import { formatCurrency } from '@/lib/pipeline/constants'
import { resolveStageLabel } from '@/lib/pipeline/stageLabels'
import i18n from '@/i18n'

type ViewMode = 'overview' | 'kanban' | 'table'

export function PipelinePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR'

  const view = (searchParams.get('view') as ViewMode) ?? 'overview'
  const setView = (nextView: ViewMode) => {
    const params = new URLSearchParams(searchParams)
    params.set('view', nextView)
    setSearchParams(params)
  }

  const [showNewDeal, setShowNewDeal] = useState(false)
  const [showManageStages, setShowManageStages] = useState(false)
  const [newDealStageId, setNewDealStageId] = useState<string | undefined>()

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
  const totalPipelineValue = useMemo(
    () => stagesWithDeals.reduce((sum, stage) => sum + stage.totalValue, 0),
    [stagesWithDeals]
  )
  const weightedPipelineValue = useMemo(
    () => stagesWithDeals.reduce((sum, stage) => sum + stage.weightedValue, 0),
    [stagesWithDeals]
  )
  const hottestStage = useMemo(
    () => stagesWithDeals.reduce<StageWithDeals | null>((best, stage) => {
      if (!best || stage.deals.length > best.deals.length) return stage
      return best
    }, null),
    [stagesWithDeals]
  )

  const subtitle = `${uniqueContactCount} ${t(uniqueContactCount === 1 ? 'pipeline.contactSingular' : 'pipeline.contactPlural')}`

  const handleAddDeal = (stageId: string) => {
    setNewDealStageId(stageId)
    setShowNewDeal(true)
  }

  return (
    <div className="flex flex-col h-full min-h-0 p-6 pb-20 lg:pb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('pipeline.title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border rounded-md overflow-hidden">
            {([
              { key: 'overview', icon: BarChart3 },
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
          {view === 'overview' && (
            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{t('pipeline.overview.activeContacts')}</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{uniqueContactCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{t('pipeline.overview.activeDeals')}</CardTitle>
                    <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{deals.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{t('pipeline.overview.pipelineValue')}</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue, 'TRY', locale)}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('pipeline.overview.weightedValue')}: {formatCurrency(weightedPipelineValue, 'TRY', locale)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{t('pipeline.overview.hottestStage')}</CardTitle>
                    <Target className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{hottestStage ? resolveStageLabel(hottestStage, t) : '—'}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('pipeline.overview.cardCount', { count: hottestStage?.deals.length ?? 0 })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="min-h-0">
                <CardHeader>
                  <CardTitle className="text-base">{t('pipeline.overview.stageSnapshot')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stagesWithDeals.map((stage) => (
                    <div key={stage.id} className="rounded-xl border bg-muted/20 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{resolveStageLabel(stage, t)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('pipeline.overview.cardCount', { count: stage.deals.length })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">{formatCurrency(stage.totalValue, 'TRY', locale)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('pipeline.overview.weightedShort')}: {formatCurrency(stage.weightedValue, 'TRY', locale)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {view === 'kanban' && (
            <div className="h-full overflow-x-auto">
              <KanbanBoard stages={stagesWithDeals} userId={userId} onAddDeal={handleAddDeal} />
            </div>
          )}

          {view === 'table' && (
            <PipelineTableView deals={deals} stages={stages} />
          )}
        </div>
      )}

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
