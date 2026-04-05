import { X } from 'lucide-react'
import { TAG_COLOR_CLASSES } from '@/lib/contacts/constants'
import type { Tag } from '@/types/database'
import { cn } from '@/lib/utils'

interface TagChipProps {
  tag: Tag
  onRemove?: () => void
  className?: string
}

export function TagChip({ tag, onRemove, className }: TagChipProps) {
  const colors = TAG_COLOR_CLASSES[tag.color] ?? TAG_COLOR_CLASSES['gray']

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
