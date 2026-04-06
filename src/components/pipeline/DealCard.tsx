import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { DEAL_TYPE_COLORS } from '@/lib/pipeline/constants'
import { getLocale } from '@/lib/calendar/dateHelpers'
import type { DealWithContact } from '@/lib/pipeline/types'

interface Props {
  deal: DealWithContact
  isDragging?: boolean
}

export function DealCard({ deal, isDragging }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const locale = getLocale()

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
      className={cn(
        'bg-card border rounded-lg p-3 cursor-pointer select-none group',
        'hover:border-primary/40 hover:shadow-sm transition-all',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg ring-2 ring-primary/30'
      )}
      onClick={() => navigate(`${ROUTES.PIPELINE}/${deal.id}`)}
    >
      {/* Drag handle + contact */}
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 text-muted-foreground/40 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{deal.contact.full_name}</p>
            <p className="text-sm font-medium leading-tight truncate">{deal.title}</p>
          </div>
        </div>
      </div>

      {/* Footer: type badge + creation date */}
      <div className="flex items-center justify-between mt-2.5 gap-2">
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', DEAL_TYPE_COLORS[deal.deal_type])}>
          {t(`pipeline.dealTypes.${deal.deal_type}`)}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(parseISO(deal.created_at), { addSuffix: true, locale })}
        </span>
      </div>
    </div>
  )
}

// Overlay version (used during drag — no sortable, just visual)
export function DealCardOverlay({ deal }: { deal: DealWithContact }) {
  const { t } = useTranslation()
  const initials = deal.contact.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="bg-card border rounded-lg p-3 shadow-xl ring-2 ring-primary/30 w-64 rotate-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{deal.contact.full_name}</p>
          <p className="text-sm font-medium leading-tight truncate">{deal.title}</p>
        </div>
      </div>
      <div className="mt-2">
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', DEAL_TYPE_COLORS[deal.deal_type])}>
          {t(`pipeline.dealTypes.${deal.deal_type}`)}
        </span>
      </div>
    </div>
  )
}
