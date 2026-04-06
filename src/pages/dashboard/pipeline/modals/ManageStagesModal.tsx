import { useState } from 'react'
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
import { STAGE_COLOR_CLASSES, type StageColor } from '@/lib/pipeline/constants'
import { useCreateStage, useUpdateStage, useDeleteStage, useReorderStages } from '@/hooks/usePipeline'
import type { PipelineStage } from '@/lib/pipeline/types'

const COLORS: StageColor[] = ['gray', 'blue', 'purple', 'amber', 'orange', 'emerald', 'red', 'pink']

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  stages: PipelineStage[]
}

interface EditingStage {
  id: string | null // null = new
  name: string
  color: StageColor
}

function SortableStageRow({
  stage,
  onEdit,
  onDelete,
  userId,
}: {
  stage: PipelineStage
  onEdit: (s: PipelineStage) => void
  onDelete: (id: string) => void
  userId: string
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

      <div className={cn('w-3 h-3 rounded-full shrink-0', colors.badge.replace('bg-', 'bg-').split(' ')[0])} />

      <span className="flex-1 text-sm font-medium">
        {t(`pipelineStages.${stage.slug}`, { defaultValue: stage.name })}
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

  // Sync when stages prop changes (if not editing)
  if (!editing && JSON.stringify(stages.map(s => s.id)) !== JSON.stringify(localStages.map(s => s.id))) {
    setLocalStages(stages)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIdx = localStages.findIndex((s) => s.id === active.id)
    const newIdx = localStages.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(localStages, oldIdx, newIdx).map((s, i) => ({ ...s, position: i }))
    setLocalStages(reordered)
    await reorderStages.mutateAsync(reordered.map((s) => ({ id: s.id, position: s.position })))
  }

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) return
    if (editing.id === null) {
      // Create new
      await createStage.mutateAsync({
        user_id: userId,
        name: editing.name,
        slug: editing.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        color: editing.color,
        position: localStages.length,
        win_probability: 50,
      })
    } else {
      await updateStage.mutateAsync({
        id: editing.id,
        data: { name: editing.name, color: editing.color },
      })
    }
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('pipeline.stage.deleteConfirm'))) return
    await deleteStage.mutateAsync(id)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('pipeline.manageStages')}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {/* Stage list */}
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={localStages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {localStages.map((s) => (
                  <SortableStageRow
                    key={s.id}
                    stage={s}
                    userId={userId}
                    onEdit={(st) => setEditing({ id: st.id, name: st.name, color: st.color })}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Edit / Create form */}
          {editing ? (
            <div className="border rounded-md p-3 space-y-3 bg-muted/30">
              <p className="text-sm font-medium">{editing.id ? t('common.edit') : t('pipeline.stage.new')}</p>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder={t('pipeline.stage.namePlaceholder')}
              />
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t('pipeline.stage.color')}</p>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditing({ ...editing, color: c })}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-all',
                        STAGE_COLOR_CLASSES[c].badge.split(' ')[0],
                        editing.color === c ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={!editing.name.trim()}>
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
              onClick={() => setEditing({ id: null, name: '', color: 'blue' })}
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
