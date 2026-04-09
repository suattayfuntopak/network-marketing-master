import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import type { DealWithContact } from '@/lib/pipeline/types'

interface Props {
  deal: DealWithContact
  isDragging?: boolean
}

export function DealCard({ deal, isDragging }: Props) {
  const navigate = useNavigate()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: deal.id,
    data: { type: 'deal', deal },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const initials = deal.contact.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing select-none',
        'hover:border-primary/40 hover:shadow-sm transition-all',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg ring-2 ring-primary/30'
      )}
      onClick={() => navigate(`${ROUTES.CONTACTS}/${deal.contact.id}`)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{deal.contact.full_name}</p>
        </div>
      </div>
    </div>
  )
}

// Overlay version (used during drag — no sortable, just visual)
export function DealCardOverlay({ deal }: { deal: DealWithContact }) {
  const initials = deal.contact.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="w-64 rotate-2 rounded-lg border bg-card p-3 shadow-xl ring-2 ring-primary/30">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0">
          {initials}
        </div>
        <p className="truncate text-sm font-semibold">{deal.contact.full_name}</p>
      </div>
    </div>
  )
}
