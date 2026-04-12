import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { buildContactCoachCue } from '@/lib/contacts/contactCoach'
import { STAGE_COLOR_CLASSES } from '@/lib/pipeline/constants'
import { resolveStageLabel } from '@/lib/pipeline/stageLabels'
import type { ProcessContact } from '@/lib/contacts/types'
import type { ContactStageKey, SyncedPipelineStage } from '@/lib/pipeline/stageLabels'

export interface ContactProcessRecord {
  contact: ProcessContact
  stageKey: ContactStageKey
}

interface ContactKanbanBoardProps {
  stages: SyncedPipelineStage[]
  records: ContactProcessRecord[]
  onMove: (contactId: string, targetStageKey: ContactStageKey) => Promise<void>
}

interface PendingMove {
  contactId: string
  targetStageKey: ContactStageKey
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function moveRecordToStageTop(
  records: ContactProcessRecord[],
  contactId: string,
  targetStageKey: ContactStageKey
) {
  const movingRecord = records.find((record) => record.contact.id === contactId)
  if (!movingRecord) return records

  const remainingRecords = records.filter((record) => record.contact.id !== contactId)
  const targetStageIndex = remainingRecords.findIndex((record) => record.stageKey === targetStageKey)
  const movedRecord = { ...movingRecord, stageKey: targetStageKey }

  if (targetStageIndex === -1) {
    return [...remainingRecords, movedRecord]
  }

  return [
    ...remainingRecords.slice(0, targetStageIndex),
    movedRecord,
    ...remainingRecords.slice(targetStageIndex),
  ]
}

function mergeRecordsPreservingOrder(
  currentRecords: ContactProcessRecord[],
  nextRecords: ContactProcessRecord[]
) {
  const nextRecordMap = new Map(nextRecords.map((record) => [record.contact.id, record]))

  const orderedRecords = currentRecords
    .filter((record) => nextRecordMap.has(record.contact.id))
    .map((record) => {
      const nextRecord = nextRecordMap.get(record.contact.id)!
      nextRecordMap.delete(record.contact.id)
      return nextRecord
    })

  const newRecords = nextRecords.filter((record) => nextRecordMap.has(record.contact.id))

  return [...orderedRecords, ...newRecords]
}

function resolveTargetStageKey(
  overId: string,
  records: ContactProcessRecord[],
  stages: SyncedPipelineStage[],
  overData?: { stageKey?: ContactStageKey }
): ContactStageKey | null {
  const stageKeys = new Set(stages.map((stage) => stage.contactStageKey))

  if (stageKeys.has(overId as ContactStageKey)) {
    return overId as ContactStageKey
  }

  if (overData?.stageKey && stageKeys.has(overData.stageKey)) {
    return overData.stageKey
  }

  return records.find((record) => record.contact.id === overId)?.stageKey ?? null
}

function ContactCard({
  record,
  dragListeners,
  dragAttributes,
  setNodeRef,
  transform,
  isDragging,
}: {
  record: ContactProcessRecord
  dragListeners?: ReturnType<typeof useDraggable>['listeners']
  dragAttributes?: ReturnType<typeof useDraggable>['attributes']
  setNodeRef?: ReturnType<typeof useDraggable>['setNodeRef']
  transform?: ReturnType<typeof useDraggable>['transform']
  isDragging?: boolean
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const coachCue = buildContactCoachCue(record.contact)

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`${ROUTES.CONTACTS}/${record.contact.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigate(`${ROUTES.CONTACTS}/${record.contact.id}`)
        }
      }}
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      className={cn(
        'group rounded-2xl border border-border/70 bg-card/80 p-3 text-left shadow-[0_12px_28px_rgba(3,7,18,0.18)] backdrop-blur-md transition-all select-none',
        'hover:border-primary/35 hover:shadow-[0_18px_36px_rgba(3,7,18,0.28)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        isDragging && 'opacity-60 shadow-[0_22px_46px_rgba(3,7,18,0.36)] ring-2 ring-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="default">
            <AvatarFallback>{getInitials(record.contact.full_name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{record.contact.full_name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {record.contact.city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {record.contact.city}
                </span>
              ) : null}
              {record.contact.occupation ? <span className="truncate">{record.contact.occupation}</span> : null}
            </div>
          </div>
        </div>

        <span
          {...dragAttributes}
          {...dragListeners}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className="mt-0.5 shrink-0 cursor-grab rounded-md p-1 text-muted-foreground transition-colors touch-none hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label={record.contact.full_name}
        >
          <GripVertical className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <WarmthScoreBadge score={record.contact.warmth_score} stage={record.contact.stage} className="max-w-full" />
        {record.contact.tagCount > 0 ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {record.contact.tagCount} {t('contacts.fields.tags')}
          </span>
        ) : null}
      </div>

      <div className="mt-3 border-t border-border/60 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t('pipeline.coach.label')}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t(`contacts.detail.coach.cues.${coachCue.key}.pipeline`)}
        </p>
      </div>
    </div>
  )
}

function DraggableContactCard({ record }: { record: ContactProcessRecord }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.contact.id,
    data: {
      contactId: record.contact.id,
      stageKey: record.stageKey,
    },
  })

  return (
    <ContactCard
      record={record}
      dragAttributes={attributes}
      dragListeners={listeners}
      setNodeRef={setNodeRef}
      transform={transform}
      isDragging={isDragging}
    />
  )
}

function PipelineColumn({
  stage,
  records,
}: {
  stage: SyncedPipelineStage
  records: ContactProcessRecord[]
}) {
  const { t } = useTranslation()
  const colors = STAGE_COLOR_CLASSES[stage.color]
  const { isOver, setNodeRef } = useDroppable({
    id: stage.contactStageKey,
    data: { stageKey: stage.contactStageKey },
  })

  return (
    <div className="flex w-[290px] shrink-0 self-start flex-col">
      <div className={cn('rounded-t-lg border-t-4 px-3 py-2.5', colors.border, colors.bg)}>
        <div className="flex items-center justify-between gap-2">
          <h3 className={cn('truncate text-sm font-semibold', colors.text)}>
            {resolveStageLabel(stage, t)}
          </h3>
          <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium', colors.badge)}>
            {records.length}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          {t(`pipeline.columnCues.${stage.contactStageKey}`)}
        </p>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[24rem] flex-col rounded-b-2xl border border-t-0 border-border/70 bg-muted/25 p-3 backdrop-blur-sm transition-colors',
          isOver && 'border-primary/45 bg-primary/8 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.12)]'
        )}
      >
        {records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record) => (
              <DraggableContactCard key={record.contact.id} record={record} />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-2 text-center text-xs text-muted-foreground/60">
            {t('pipeline.emptyColumn')}
          </div>
        )}
      </div>
    </div>
  )
}

export function ContactKanbanBoard({ stages, records, onMove }: ContactKanbanBoardProps) {
  const { t } = useTranslation()
  const [activeContactId, setActiveContactId] = useState<string | null>(null)
  const [localRecords, setLocalRecords] = useState(records)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const dragSnapshotRef = useRef<ContactProcessRecord[] | null>(null)

  useEffect(() => {
    const pendingRecord = pendingMove
      ? records.find((record) => record.contact.id === pendingMove.contactId)
      : null
    const pendingSettled = pendingMove
      ? pendingRecord?.stageKey === pendingMove.targetStageKey
      : false

    if (pendingMove && pendingSettled) {
      setPendingMove(null)
    }

    if (activeContactId) return
    if (pendingMove && !pendingSettled) return

    setLocalRecords((current) => mergeRecordsPreservingOrder(current, records))
  }, [records, activeContactId, pendingMove])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  )

  const activeRecord = useMemo(
    () => localRecords.find((record) => record.contact.id === activeContactId) ?? null,
    [activeContactId, localRecords]
  )

  const groupedRecords = useMemo(() => {
    return stages.reduce<Record<string, ContactProcessRecord[]>>((acc, stage) => {
      acc[stage.contactStageKey] = localRecords.filter((record) => record.stageKey === stage.contactStageKey)

      return acc
    }, {})
  }, [localRecords, stages])

  const resetDragState = () => {
    setActiveContactId(null)
  }

  const restoreDragSnapshot = () => {
    if (dragSnapshotRef.current) {
      setLocalRecords(dragSnapshotRef.current)
    }
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    const contactId = (active.data.current?.contactId as string | undefined) ?? (active.id as string)
    dragSnapshotRef.current = localRecords
    setActiveContactId(contactId)
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) {
      restoreDragSnapshot()
      dragSnapshotRef.current = null
      resetDragState()
      return
    }

    const contactId = (active.data.current?.contactId as string | undefined) ?? (active.id as string)
    const sourceStageKey = active.data.current?.stageKey as ContactStageKey | undefined
    const targetStageKey = resolveTargetStageKey(
      String(over.id),
      localRecords,
      stages,
      over.data.current as { stageKey?: ContactStageKey } | undefined
    )
    const currentRecord = localRecords.find((record) => record.contact.id === contactId)

    if (!currentRecord || !sourceStageKey || !targetStageKey || sourceStageKey === targetStageKey) {
      dragSnapshotRef.current = null
      resetDragState()
      return
    }

    const previousRecords = dragSnapshotRef.current ?? localRecords

    setPendingMove({ contactId, targetStageKey })
    setLocalRecords((current) => moveRecordToStageTop(current, contactId, targetStageKey))

    try {
      await onMove(contactId, targetStageKey)
    } catch {
      setPendingMove(null)
      setLocalRecords(previousRecords)
      toast.error(t('pipeline.dragError'))
    } finally {
      dragSnapshotRef.current = null
      resetDragState()
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragCancel={() => {
        restoreDragSnapshot()
        dragSnapshotRef.current = null
        resetDragState()
      }}
      onDragEnd={(event) => {
        void handleDragEnd(event)
      }}
    >
      <div className="flex items-start gap-4 pb-4">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            records={groupedRecords[stage.contactStageKey] ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeRecord ? <ContactCard record={activeRecord} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
