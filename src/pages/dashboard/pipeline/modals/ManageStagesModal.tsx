import { useEffect, useState } from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { STAGE_COLOR_CLASSES, STAGE_COLOR_SEQUENCE, getRandomReadableStageColor, type StageColor } from '@/lib/pipeline/constants'
import { useCreateStage, useUpdateStage, useDeleteStage, useReorderStages } from '@/hooks/usePipeline'
import type { PipelineStage } from '@/lib/pipeline/types'
import { getStageLabelConfig, resolveStageLabel, serializeStageLabelConfig, slugifyStageLabel } from '@/lib/pipeline/stageLabels'

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
      className={cn('flex items-center gap-3 p-2 rounded-md border bg-card', isDragging && 'opacity-50 shadow-md')}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className={cn('w-3 h-3 rounded-full shrink-0', colors.badge.split(' ')[0])} />

      <span className="flex-1 text-sm font-medium truncate">
        {resolveStageLabel(stage, t)}
      </span>

      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(stage)}
          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {!stage.is_system && (
          <button
            onClick={() => onDelete(stage.id)}
            className="p-1 text-muted-foreground hover:text-red-500 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function ManageStagesModal({ open, onClose, userId, stages }: Props) {
  const { t } = useTranslation()
  const createStage = useCreateStage(userId)
  const updateStage = useUpdateStage(userId)
  const deleteStage = useDeleteStage(userId)
  const reorderStages = useReorderStages(userId)

  const [editing, setEditing] = useState<EditingStage | null>(null)
  const [localStages, setLocalStages] = useState(stages)

  useEffect(() => {
    if (!editing) {
      setLocalStages(stages)
    }
  }, [stages, editing])

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
    setEditing({
      id: stage.id,
      trLabel: labels.trLabel,
      enLabel: labels.enLabel,
      color: stage.color,
    })
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
    })

    if (editing.id === null) {
      const created = await createStage.mutateAsync({
        user_id: userId,
        name: primaryLabel,
        slug: slugifyStageLabel(enLabel || trLabel || primaryLabel),
        description,
        color: editing.color,
        position: localStages.length,
        win_probability: 50,
      })
      setLocalStages((current) => [...current, created].sort((a, b) => a.position - b.position))
    } else {
      const updated = await updateStage.mutateAsync({
        id: editing.id,
        data: {
          name: primaryLabel,
          description,
          color: editing.color,
        },
      })
      setLocalStages((current) => current.map((stage) => (stage.id === updated.id ? updated : stage)).sort((a, b) => a.position - b.position))
    }

    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('pipeline.stage.deleteConfirm'))) return
    await deleteStage.mutateAsync(id)
    setLocalStages((current) => current.filter((stage) => stage.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pipeline.manageStages')}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={localStages.map((stage) => stage.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
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
            <div className="border rounded-md p-3 space-y-3 bg-muted/30">
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
                <p className="text-xs text-muted-foreground mb-2">{t('pipeline.stage.color')}</p>
                <div className="flex gap-2 flex-wrap">
                  {STAGE_COLOR_SEQUENCE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditing({ ...editing, color })}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-all',
                        STAGE_COLOR_CLASSES[color].badge.split(' ')[0],
                        editing.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={!editing.trLabel.trim() && !editing.enLabel.trim()}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {t('common.save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setEditing({
                id: null,
                trLabel: '',
                enLabel: '',
                color: getRandomReadableStageColor(localStages.length),
              })}
            >
              <Plus className="w-4 h-4" />
              {t('pipeline.stage.new')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
