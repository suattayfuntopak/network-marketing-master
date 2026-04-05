import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { pipelineKeys } from '@/hooks/usePipeline'
import type { StageWithDeals, DealWithContact } from '@/lib/pipeline/types'
import { moveDealToStage } from '@/lib/pipeline/mutations'
import { KanbanColumn } from './KanbanColumn'
import { DealCardOverlay } from './DealCard'

interface Props {
  stages: StageWithDeals[]
  userId: string
  onAddDeal: (stageId: string) => void
}

export function KanbanBoard({ stages: initialStages, userId, onAddDeal }: Props) {
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeDeal, setActiveDeal] = useState<DealWithContact | null>(null)
  const [overStageId, setOverStageId] = useState<string | null>(null)

  // Local optimistic state for stages
  const [optimisticStages, setOptimisticStages] = useState<StageWithDeals[]>(initialStages)

  // Sync when props change (new data from query)
  if (JSON.stringify(initialStages.map(s => s.id + s.deals.length)) !==
      JSON.stringify(optimisticStages.map(s => s.id + s.deals.length)) &&
      activeId === null) {
    setOptimisticStages(initialStages)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const findStageForDeal = useCallback((dealId: string, stages: StageWithDeals[]) => {
    return stages.find((s) => s.deals.some((d) => d.id === dealId))
  }, [])

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
    const stage = findStageForDeal(active.id as string, optimisticStages)
    const deal = stage?.deals.find((d) => d.id === active.id)
    if (deal) setActiveDeal(deal)
  }, [optimisticStages, findStageForDeal])

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    if (!over) { setOverStageId(null); return }
    // over can be a stage column or another deal
    const overId = over.id as string
    const overStage = optimisticStages.find((s) => s.id === overId)
    if (overStage) {
      setOverStageId(overId)
    } else {
      const stageForOver = findStageForDeal(overId, optimisticStages)
      setOverStageId(stageForOver?.id ?? null)
    }
  }, [optimisticStages, findStageForDeal])

  const handleDragEnd = useCallback(async ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    setActiveDeal(null)
    setOverStageId(null)

    if (!over || !activeId) return

    const overId = over.id as string
    const fromStage = findStageForDeal(activeId, optimisticStages)
    if (!fromStage) return

    // Determine target stage
    const toStage = optimisticStages.find((s) => s.id === overId)
      ?? findStageForDeal(overId, optimisticStages)
    if (!toStage) return

    const isSameStage = fromStage.id === toStage.id

    // Build new optimistic state
    setOptimisticStages((prev) => {
      const newStages = prev.map((s) => ({ ...s, deals: [...s.deals] }))
      const fromIdx = newStages.findIndex((s) => s.id === fromStage.id)
      const toIdx = newStages.findIndex((s) => s.id === toStage.id)
      const dealIdx = newStages[fromIdx].deals.findIndex((d) => d.id === activeId)
      const [movedDeal] = newStages[fromIdx].deals.splice(dealIdx, 1)

      if (isSameStage) {
        const overDealIdx = newStages[toIdx].deals.findIndex((d) => d.id === overId)
        if (overDealIdx >= 0) {
          const oldIdx = newStages[fromIdx].deals.indexOf(movedDeal)
          // arrayMove equivalent
          newStages[fromIdx].deals = arrayMove(
            [...newStages[fromIdx].deals, movedDeal],
            newStages[fromIdx].deals.length,
            overDealIdx
          )
        } else {
          newStages[toIdx].deals.push({ ...movedDeal, stage_id: toStage.id })
        }
      } else {
        const overDealIdx = newStages[toIdx].deals.findIndex((d) => d.id === overId)
        const insertAt = overDealIdx >= 0 ? overDealIdx : newStages[toIdx].deals.length
        newStages[toIdx].deals.splice(insertAt, 0, { ...movedDeal, stage_id: toStage.id })
      }

      // Recalculate totals
      return newStages.map((s) => ({
        ...s,
        totalValue: s.deals.reduce((sum, d) => sum + (d.value ?? 0), 0),
        weightedValue: s.deals.reduce((sum, d) => sum + ((d.value ?? 0) * (d.probability ?? 0)) / 100, 0),
      }))
    })

    // Persist to DB
    try {
      const newPosition = toStage.deals.findIndex((d) => d.id === overId)
      await moveDealToStage(activeId, toStage.id, newPosition >= 0 ? newPosition : toStage.deals.length)
      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
      qc.invalidateQueries({ queryKey: pipelineKeys.stats(userId) })
    } catch {
      // Rollback on error
      setOptimisticStages(initialStages)
      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
    }
  }, [activeId, optimisticStages, findStageForDeal, userId, qc, initialStages])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-0">
        {optimisticStages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            onAddDeal={onAddDeal}
            isOver={overStageId === stage.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && <DealCardOverlay deal={activeDeal} />}
      </DragOverlay>
    </DndContext>
  )
}
