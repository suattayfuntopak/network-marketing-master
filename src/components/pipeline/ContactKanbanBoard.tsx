import { useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragStartEvent, type DragEndEvent, closestCenter,
} from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { StageBadge } from '@/components/contacts/StageBadge'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { useUpdateContactStageById } from '@/hooks/useContact'
import { ROUTES } from '@/lib/constants'
import type { ContactWithTags } from '@/lib/contacts/types'
import type { Contact } from '@/types/database'

const CONTACT_STAGES = ['new', 'contacted', 'interested', 'presenting', 'thinking', 'joined', 'lost'] as const

const STAGE_HEADER_COLORS: Record<string, string> = {
  new: 'border-t-gray-400 bg-gray-50 dark:bg-gray-900/30',
  contacted: 'border-t-blue-500 bg-blue-50 dark:bg-blue-950/30',
  interested: 'border-t-purple-500 bg-purple-50 dark:bg-purple-950/30',
  presenting: 'border-t-amber-500 bg-amber-50 dark:bg-amber-950/30',
  thinking: 'border-t-orange-500 bg-orange-50 dark:bg-orange-950/30',
  joined: 'border-t-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  lost: 'border-t-red-500 bg-red-50 dark:bg-red-950/30',
}

interface ContactCardProps {
  contact: ContactWithTags
  isDragging?: boolean
}

function ContactCard({ contact, isDragging }: ContactCardProps) {
  const navigate = useNavigate()
  const initials = contact.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div
      className={cn(
        'bg-card border rounded-md p-2.5 space-y-1.5 text-sm cursor-pointer hover:border-primary/40 transition-colors',
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <p className="font-medium truncate flex-1 text-xs">{contact.full_name}</p>
      </div>
      {contact.occupation && (
        <p className="text-xs text-muted-foreground truncate">{contact.occupation}</p>
      )}
      <div className="flex items-center gap-1.5">
        <WarmthScoreBadge score={contact.warmth_score} />
      </div>
    </div>
  )
}

function SortableContactCard({ contact }: { contact: ContactWithTags }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: contact.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ContactCard contact={contact} isDragging={isDragging} />
    </div>
  )
}

interface ColumnProps {
  stage: string
  contacts: ContactWithTags[]
  isOver: boolean
}

function ContactKanbanColumn({ stage, contacts, isOver }: ColumnProps) {
  const { t } = useTranslation()
  const { setNodeRef } = useDroppable({ id: stage })

  return (
    <div className="flex flex-col w-[200px] shrink-0">
      <div className={cn('rounded-t-lg border-t-4 px-3 py-2.5', STAGE_HEADER_COLORS[stage] ?? 'border-t-gray-400 bg-muted')}>
        <div className="flex items-center justify-between gap-2">
          <StageBadge stage={stage as Contact['stage']} />
          <span className="text-xs font-semibold text-muted-foreground">{contacts.length}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[120px] rounded-b-lg border border-t-0 p-2 space-y-2 overflow-y-auto bg-muted/20 transition-colors',
          isOver && 'bg-primary/5 border-primary/30'
        )}
      >
        <SortableContext items={contacts.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {contacts.map(contact => (
            <SortableContactCard key={contact.id} contact={contact} />
          ))}
        </SortableContext>
        {contacts.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">{t('pipeline.emptyColumn')}</p>
        )}
      </div>
    </div>
  )
}

interface Props {
  contacts: ContactWithTags[]
  userId: string
}

export function ContactKanbanBoard({ contacts, userId }: Props) {
  const updateStage = useUpdateContactStageById(userId)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)

  // Build stage → contacts map with optimistic state
  const [optimisticContacts, setOptimisticContacts] = useState(contacts)

  // Sync when props change (not during drag)
  if (activeId === null) {
    const propsKey = contacts.map(c => c.id + c.stage).join()
    const optKey = optimisticContacts.map(c => c.id + c.stage).join()
    if (propsKey !== optKey) setOptimisticContacts(contacts)
  }

  const grouped = CONTACT_STAGES.reduce((acc, stage) => {
    acc[stage] = optimisticContacts.filter(c => c.stage === stage)
    return acc
  }, {} as Record<string, ContactWithTags[]>)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const activeContact = optimisticContacts.find(c => c.id === activeId) ?? null

  const findStageForContact = useCallback((id: string) => {
    return CONTACT_STAGES.find(stage => grouped[stage]?.some(c => c.id === id))
  }, [grouped])

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    setOverStage(null)
    if (!over) return

    const contactId = active.id as string
    const oldStage = findStageForContact(contactId) ?? ''
    // `over.id` can be a contact id or a stage id (droppable)
    const newStage = CONTACT_STAGES.includes(over.id as typeof CONTACT_STAGES[number])
      ? over.id as string
      : findStageForContact(over.id as string) ?? oldStage

    if (newStage === oldStage) return

    // Optimistic update
    setOptimisticContacts(prev =>
      prev.map(c => c.id === contactId ? { ...c, stage: newStage as Contact['stage'] } : c)
    )

    updateStage.mutate({ contactId, newStage, oldStage }, {
      onError: () => {
        // Revert on error
        setOptimisticContacts(contacts)
      },
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={({ over }) => setOverStage(
        over ? (CONTACT_STAGES.includes(over.id as typeof CONTACT_STAGES[number]) ? over.id as string : findStageForContact(over.id as string) ?? null) : null
      )}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-0 h-full">
        {CONTACT_STAGES.map(stage => (
          <ContactKanbanColumn
            key={stage}
            stage={stage}
            contacts={grouped[stage] ?? []}
            isOver={overStage === stage}
          />
        ))}
      </div>
      <DragOverlay>
        {activeContact && <ContactCard contact={activeContact} />}
      </DragOverlay>
    </DndContext>
  )
}
