import { useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import { GripVertical, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { STAGE_COLOR_CLASSES, STAGE_COLOR_SEQUENCE, getRandomReadableStageColor, type StageColor } from '@/lib/pipeline/constants'
import { useCreateStage, useUpdateStage, useDeleteStage, useReorderStages } from '@/hooks/usePipeline'
import type { PipelineStage } from '@/lib/pipeline/types'
import {
  CONTACT_STAGE_KEYS,
  getStageLabelConfig,
  getSyncedPipelineStages,
  resolveStageLabel,
  serializeStageLabelConfig,
  slugifyStageLabel,
  type ContactStageKey,
} from '@/lib/pipeline/stageLabels'

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  stages: PipelineStage[]
}

interface EditingStage {
  id: string | null
  trLabel: string
  enLabel: string
  color: StageColor
  contactStageKey: ContactStageKey
}

function SortableStageRow({
  stage,
  onEdit,
  onDelete,
}: {
  stage: PipelineStage
  onEdit: (stage: PipelineStage) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()
  const colors = STAGE_COLOR_CLASSES[stage.color]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-3 rounded-md border bg-card p-2', isDragging && 'opacity-50 shadow-md')}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className={cn('h-3 w-3 shrink-0 rounded-full', colors.badge.split(' ')[0])} />

      <span className="flex-1 truncate text-sm font-medium">
        {resolveStageLabel(stage, t)}
      </span>

      <div className="flex shrink-0 gap-1">
        <button
          onClick={() => onEdit(stage)}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(stage.id)}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function ManageStagesModal({ open, onClose, userId, stages }: Props) {
  const stageSignature = useMemo(
    () => stages.map((stage) => `${stage.id}:${stage.position}:${stage.updated_at}`).join('|'),
    [stages]
  )

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      {open ? (
        <ManageStagesModalContent
          key={stageSignature}
          onClose={onClose}
          stages={stages}
          userId={userId}
        />
      ) : null}
    </Dialog>
  )
}

function ManageStagesModalContent({ onClose, userId, stages }: Omit<Props, 'open'>) {
  const { t } = useTranslation()
  const createStage = useCreateStage(userId)
  const updateStage = useUpdateStage(userId)
  const deleteStage = useDeleteStage(userId)
  const reorderStages = useReorderStages(userId)

  const [editing, setEditing] = useState<EditingStage | null>(null)
  const [localStages, setLocalStages] = useState(stages)
  const canCreateStage = localStages.length < CONTACT_STAGE_KEYS.length
  const syncedStages = getSyncedPipelineStages(localStages)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    const oldIndex = localStages.findIndex((stage) => stage.id === active.id)
    const newIndex = localStages.findIndex((stage) => stage.id === over.id)
    const reordered = arrayMove(localStages, oldIndex, newIndex).map((stage, index) => ({
      ...stage,
      position: index,
    }))

    setLocalStages(reordered)
    await reorderStages.mutateAsync(reordered.map((stage) => ({ id: stage.id, position: stage.position })))
  }

  const openEdit = (stage: PipelineStage) => {
    const labels = getStageLabelConfig(stage)
    const syncedStage = syncedStages.find((item) => item.id === stage.id)
    setEditing({
      id: stage.id,
      trLabel: labels.trLabel,
      enLabel: labels.enLabel,
      color: stage.color,
      contactStageKey: syncedStage?.contactStageKey ?? 'new',
    })
  }

  const getDefaultContactStageKey = (): ContactStageKey => {
    const usedKeys = new Set(syncedStages.map((stage) => stage.contactStageKey))
    return CONTACT_STAGE_KEYS.find((key) => !usedKeys.has(key)) ?? 'lost'
  }

  const handleSave = async () => {
    if (!editing) return

    const trLabel = editing.trLabel.trim()
    const enLabel = editing.enLabel.trim()
    const primaryLabel = trLabel || enLabel
    if (!primaryLabel) return

    const description = serializeStageLabelConfig({
      trLabel: trLabel || primaryLabel,
      enLabel: enLabel || primaryLabel,
      contactStageKey: editing.contactStageKey,
    })

    if (editing.id === null) {
      if (!canCreateStage) {
        toast.error(t('pipeline.stage.limitReached'))
        return
      }

      const created = await createStage.mutateAsync({
        user_id: userId,
        name: primaryLabel,
        slug: slugifyStageLabel(enLabel || trLabel || primaryLabel),
        description,
        color: editing.color,
        position: localStages.length,
        win_probability: 50,
        is_won_stage: editing.contactStageKey === 'joined',
        is_lost_stage: editing.contactStageKey === 'lost',
      })
      setLocalStages((current) => [...current, created].sort((a, b) => a.position - b.position))
    } else {
      const updated = await updateStage.mutateAsync({
        id: editing.id,
        data: {
          name: primaryLabel,
          description,
          color: editing.color,
          is_won_stage: editing.contactStageKey === 'joined',
          is_lost_stage: editing.contactStageKey === 'lost',
        },
      })
      setLocalStages((current) => current.map((stage) => (stage.id === updated.id ? updated : stage)).sort((a, b) => a.position - b.position))
    }

    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (localStages.length <= 1) {
      toast.error(t('pipeline.stage.minReached'))
      return
    }

    if (!confirm(t('pipeline.stage.deleteConfirm'))) return
    await deleteStage.mutateAsync(id)
    setLocalStages((current) => current.filter((stage) => stage.id !== id))
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{t('pipeline.manageStages')}</DialogTitle>
      </DialogHeader>

      <div className="mt-2 space-y-3">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={localStages.map((stage) => stage.id)} strategy={verticalListSortingStrategy}>
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {localStages.map((stage) => (
                <SortableStageRow
                  key={stage.id}
                  stage={stage}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {editing ? (
          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            <p className="text-sm font-medium">{editing.id ? t('common.edit') : t('pipeline.stage.new')}</p>
            <Input
              value={editing.trLabel}
              onChange={(event) => setEditing({ ...editing, trLabel: event.target.value })}
              placeholder={t('pipeline.stage.trLabelPlaceholder')}
            />
            <Input
              value={editing.enLabel}
              onChange={(event) => setEditing({ ...editing, enLabel: event.target.value })}
              placeholder={t('pipeline.stage.enLabelPlaceholder')}
            />
            <div>
              <p className="mb-2 text-xs text-muted-foreground">{t('pipeline.stage.color')}</p>
              <div className="flex flex-wrap gap-2">
                {STAGE_COLOR_SEQUENCE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditing({ ...editing, color })}
                    className={cn(
                      'h-6 w-6 rounded-full border-2 transition-all',
                      STAGE_COLOR_CLASSES[color].badge.split(' ')[0],
                      editing.color === color ? 'scale-110 border-foreground' : 'border-transparent'
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={!editing.trLabel.trim() && !editing.enLabel.trim()}>
                <Check className="mr-1 h-3.5 w-3.5" />
                {t('common.save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                <X className="mr-1 h-3.5 w-3.5" />
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            disabled={!canCreateStage}
            onClick={() => setEditing({
              id: null,
              trLabel: '',
              enLabel: '',
              color: getRandomReadableStageColor(localStages.length),
              contactStageKey: getDefaultContactStageKey(),
            })}
          >
            <Plus className="h-4 w-4" />
            {canCreateStage ? t('pipeline.stage.new') : t('pipeline.stage.limitReached')}
          </Button>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}
