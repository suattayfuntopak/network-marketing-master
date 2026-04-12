import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { MoreHorizontal, Edit, Archive, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StageBadge } from './StageBadge'
import { WarmthScoreBar } from './WarmthScoreBar'
import { ChannelButtons } from './ChannelButtons'
import { TagChip } from './TagChip'
import type { ContactWithTags } from '@/lib/contacts/types'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ContactCardProps {
  contact: ContactWithTags
  stageLabel?: string
  selected: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}

export function ContactCard({
  contact,
  stageLabel,
  selected,
  onToggleSelect,
  onEdit,
  onArchive,
  onDelete,
}: ContactCardProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const dateLocale = i18n.language?.startsWith('en') ? enUS : tr

  return (
    <div
      onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
      className={cn(
        'rounded-lg border border-border bg-card p-4 cursor-pointer transition-colors hover:border-primary/30 hover:bg-muted/20 space-y-3',
        selected && 'border-primary bg-primary/5'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
            {contact.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{contact.full_name}</p>
            {contact.nickname && (
              <p className="text-xs text-muted-foreground">"{contact.nickname}"</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 rounded-md hover:bg-accent transition-colors outline-none">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="w-4 h-4 mr-2" />
                {contact.is_archived ? t('common.unarchive') : t('common.archive')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <StageBadge stage={contact.stage} label={stageLabel} />
        {contact.last_contact_at && (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(contact.last_contact_at), { addSuffix: true, locale: dateLocale })}
          </span>
        )}
      </div>

      <WarmthScoreBar score={contact.warmth_score} stage={contact.stage} />

      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <ChannelButtons contact={contact} size="sm" />
        <div className="flex flex-wrap gap-1 justify-end">
          {contact.tags.slice(0, 2).map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
          {contact.tags.length > 2 && (
            <span className="text-xs text-muted-foreground self-center">+{contact.tags.length - 2}</span>
          )}
        </div>
      </div>
    </div>
  )
}
