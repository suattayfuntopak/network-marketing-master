import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { STAGE_COLOR_CLASSES } from '@/lib/pipeline/constants'
import { resolveStageLabel } from '@/lib/pipeline/stageLabels'
import type { ContactWithTags } from '@/lib/contacts/types'
import type { PipelineStage } from '@/lib/pipeline/types'

export interface ContactProcessRecord {
  contact: ContactWithTags
  dealId: string | null
  stageId: string
}

interface ContactKanbanBoardProps {
  stages: PipelineStage[]
  records: ContactProcessRecord[]
  onMove: (contactId: string, targetStageId: string) => Promise<void>
}

function ContactCard({
  record,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  record: ContactProcessRecord
  isDragging: boolean
  onDragStart: (contactId: string) => void
  onDragEnd: () => void
}) {
  const navigate = useNavigate()
  const initials = record.contact.full_name
    .split(' ')
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', record.contact.id)
        event.dataTransfer.effectAllowed = 'move'
        onDragStart(record.contact.id)
      }}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`${ROUTES.CONTACTS}/${record.contact.id}`)}
      className={cn(
        'cursor-grab rounded-xl border bg-card p-3 select-none transition-all active:cursor-grabbing',
        'hover:border-primary/40 hover:shadow-sm',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary/30'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0">
          {initials}
        </div>
        <p className="truncate text-sm font-semibold">{record.contact.full_name}</p>
      </div>
    </div>
  )
}

export function ContactKanbanBoard({ stages, records, onMove }: ContactKanbanBoardProps) {
  const { t } = useTranslation()
  const [activeContactId, setActiveContactId] = useState<string | null>(null)
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null)
  const [localRecords, setLocalRecords] = useState(records)

  useEffect(() => {
    if (!activeContactId) {
      setLocalRecords(records)
    }
  }, [records, activeContactId])

  const groupedRecords = useMemo(() => {
    return stages.reduce<Record<string, ContactProcessRecord[]>>((acc, stage) => {
      acc[stage.id] = localRecords
        .filter((record) => record.stageId === stage.id)
        .sort((a, b) => a.contact.full_name.localeCompare(b.contact.full_name, 'tr'))
      return acc
    }, {})
  }, [localRecords, stages])

  const handleDrop = async (contactId: string, targetStageId: string) => {
    const currentRecord = localRecords.find((record) => record.contact.id === contactId)
    if (!currentRecord || currentRecord.stageId === targetStageId) {
      setActiveContactId(null)
      setHoveredStageId(null)
      return
    }

    const previousRecords = localRecords

    setLocalRecords((current) =>
      current.map((record) =>
        record.contact.id === contactId ? { ...record, stageId: targetStageId } : record
      )
    )
    setActiveContactId(null)
    setHoveredStageId(null)

    try {
      await onMove(contactId, targetStageId)
    } catch {
      setLocalRecords(previousRecords)
      toast.error(t('pipeline.dragError'))
    }
  }

  return (
    <div className="flex h-full min-h-0 gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const colors = STAGE_COLOR_CLASSES[stage.color]
        const stageRecords = groupedRecords[stage.id] ?? []

        return (
          <div key={stage.id} className="flex min-h-full w-[280px] shrink-0 flex-col">
            <div className={cn('rounded-t-lg border-t-4 px-3 py-2.5', colors.border, colors.bg)}>
              <div className="flex items-center justify-between gap-2">
                <h3 className={cn('truncate text-sm font-semibold', colors.text)}>
                  {resolveStageLabel(stage, t)}
                </h3>
                <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium', colors.badge)}>
                  {stageRecords.length}
                </span>
              </div>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setHoveredStageId(stage.id)
              }}
              onDragLeave={() => {
                if (hoveredStageId === stage.id) setHoveredStageId(null)
              }}
              onDrop={(event) => {
                event.preventDefault()
                const contactId = event.dataTransfer.getData('text/plain')
                void handleDrop(contactId, stage.id)
              }}
              className={cn(
                'flex min-h-[calc(100vh-15rem)] flex-1 flex-col rounded-b-lg border border-t-0 bg-muted/30 p-3 transition-colors',
                hoveredStageId === stage.id && 'border-primary/30 bg-primary/5'
              )}
            >
              {stageRecords.length > 0 ? (
                <div className="space-y-3">
                  {stageRecords.map((record) => (
                    <ContactCard
                      key={record.contact.id}
                      record={record}
                      isDragging={activeContactId === record.contact.id}
                      onDragStart={setActiveContactId}
                      onDragEnd={() => {
                        setActiveContactId(null)
                        setHoveredStageId(null)
                      }}
                    />
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
      })}
    </div>
  )
}
