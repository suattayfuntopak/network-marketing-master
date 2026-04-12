import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  getFirstCollision,
    pointerWithin,
    rectIntersection,
    type CollisionDetection,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { pipelineKeys } from '@/hooks/usePipeline'
import type { DealWithContact, StageWithDeals } from '@/lib/pipeline/types'
import { syncDealsBoardState } from '@/lib/pipeline/mutations'
import { KanbanColumn } from './KanbanColumn'
import { DealCardOverlay } from './DealCard'

interface Props {
  stages: StageWithDeals[]
  userId: string
}

function recalculateStages(stages: StageWithDeals[]) {
  return stages.map((stage) => {
    const deals = stage.deals.map((deal, index) => ({
      ...deal,
      stage_id: stage.id,
      position_in_stage: index,
    }))

    return {
      ...stage,
      deals,
      totalValue: deals.reduce((sum, deal) => sum + (deal.value ?? 0), 0),
      weightedValue: deals.reduce((sum, deal) => sum + ((deal.value ?? 0) * (deal.probability ?? 0)) / 100, 0),
    }
  })
}

export function KanbanBoard({ stages: initialStages, userId }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDeal, setActiveDeal] = useState<DealWithContact | null>(null)
  const [overStageId, setOverStageId] = useState<string | null>(null)
  const [optimisticStages, setOptimisticStages] = useState<StageWithDeals[]>(initialStages)
  const snapshotRef = useRef<StageWithDeals[]>(initialStages)
  const lastOverId = useRef<string | null>(null)

  useEffect(() => {
    if (activeId === null) {
      setOptimisticStages(initialStages)
      snapshotRef.current = initialStages
    }
  }, [initialStages, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  const findStageForDeal = useCallback((dealId: string, stages: StageWithDeals[]) => {
    return stages.find((stage) => stage.deals.some((deal) => deal.id === dealId))
  }, [])

  const moveDealInStages = useCallback((stages: StageWithDeals[], currentActiveId: string, overId: string) => {
    const fromStage = findStageForDeal(currentActiveId, stages)
    const toStage = stages.find((stage) => stage.id === overId) ?? findStageForDeal(overId, stages)

    if (!fromStage || !toStage) return stages

    const clonedStages = stages.map((stage) => ({ ...stage, deals: [...stage.deals] }))
    const fromStageIndex = clonedStages.findIndex((stage) => stage.id === fromStage.id)
    const toStageIndex = clonedStages.findIndex((stage) => stage.id === toStage.id)
    const activeIndex = clonedStages[fromStageIndex].deals.findIndex((deal) => deal.id === currentActiveId)

    if (activeIndex < 0) return stages

    const [movedDeal] = clonedStages[fromStageIndex].deals.splice(activeIndex, 1)
    const overIsStage = clonedStages.some((stage) => stage.id === overId)
    const overDealIndex = clonedStages[toStageIndex].deals.findIndex((deal) => deal.id === overId)
    const rawInsertIndex = overIsStage ? clonedStages[toStageIndex].deals.length : Math.max(0, overDealIndex)
    const insertIndex =
      fromStage.id === toStage.id && !overIsStage && activeIndex < rawInsertIndex
        ? rawInsertIndex - 1
        : rawInsertIndex

    clonedStages[toStageIndex].deals.splice(insertIndex, 0, {
      ...movedDeal,
      stage_id: toStage.id,
    })

    return recalculateStages(clonedStages)
  }, [findStageForDeal])

  const collisionDetectionStrategy = useCallback<CollisionDetection>((args) => {
    const pointerIntersections = pointerWithin(args)
    const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args)
    let overId = getFirstCollision(intersections, 'id') as string | null

    if (overId) {
      const stage = optimisticStages.find((item) => item.id === overId)
      if (stage && stage.deals.length > 0) {
        const dealIntersections = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            stage.deals.some((deal) => deal.id === container.id)
          ),
        })
        overId = (dealIntersections[0]?.id as string | undefined) ?? overId
      }

      lastOverId.current = overId
      return [{ id: overId }]
    }

    if (lastOverId.current) {
      return [{ id: lastOverId.current }]
    }

    return []
  }, [optimisticStages])

  const resetDragState = useCallback((rollback = false) => {
    if (rollback) {
      setOptimisticStages(snapshotRef.current)
    }

    setActiveId(null)
    setActiveDeal(null)
    setOverStageId(null)
    lastOverId.current = null
  }, [])

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const nextActiveId = active.id as string
    setActiveId(nextActiveId)
    snapshotRef.current = optimisticStages

    const stage = findStageForDeal(nextActiveId, optimisticStages)
    const deal = stage?.deals.find((item) => item.id === nextActiveId) ?? null
    setActiveDeal(deal)
  }, [optimisticStages, findStageForDeal])

  const handleDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over) {
      setOverStageId(null)
      return
    }

    const overId = over.id as string
    const nextStage = optimisticStages.find((stage) => stage.id === overId) ?? findStageForDeal(overId, optimisticStages)
    setOverStageId(nextStage?.id ?? null)

    if (active.id !== over.id) {
      setOptimisticStages((current) => moveDealInStages(current, active.id as string, overId))
    }
  }, [findStageForDeal, moveDealInStages, optimisticStages])

  const handleDragCancel = useCallback(() => {
    resetDragState(true)
  }, [resetDragState])

  const handleDragEnd = useCallback(async ({ active, over }: DragEndEvent) => {
    if (!over || !activeId) {
      resetDragState(true)
      return
    }

    const finalStages = moveDealInStages(optimisticStages, active.id as string, over.id as string)
    const changedStages = finalStages.filter((stage) => {
      const previousStage = snapshotRef.current.find((item) => item.id === stage.id)
      const currentSignature = stage.deals.map((deal) => `${deal.id}:${deal.position_in_stage}`).join('|')
      const previousSignature = previousStage?.deals.map((deal) => `${deal.id}:${deal.position_in_stage}`).join('|') ?? ''
      return currentSignature !== previousSignature
    })

    try {
      if (changedStages.length > 0) {
        await syncDealsBoardState(
          changedStages.flatMap((stage) =>
            stage.deals.map((deal) => ({
              id: deal.id,
              stage_id: stage.id,
              position_in_stage: deal.position_in_stage,
            }))
          )
        )
      }

      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
      qc.invalidateQueries({ queryKey: pipelineKeys.stats(userId) })
    } catch {
      setOptimisticStages(snapshotRef.current)
      toast.error(t('pipeline.dragError'))
      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
    } finally {
      resetDragState(false)
    }
  }, [activeId, moveDealInStages, optimisticStages, qc, resetDragState, t, userId])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-full gap-4 overflow-x-auto pb-4">
        {optimisticStages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            isOver={overStageId === stage.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? <DealCardOverlay deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
