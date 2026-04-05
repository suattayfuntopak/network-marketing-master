import { X, Tag, LayoutList, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { STAGE_LABELS } from '@/lib/contacts/constants'
import type { Tag as TagType } from '@/types/database'
import { useTranslation } from 'react-i18next'

interface BulkActionsBarProps {
  count: number
  tags: TagType[]
  onClear: () => void
  onAddTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
  onChangeStage: (stage: string) => void
  onArchive: () => void
  onDelete: () => void
}

export function BulkActionsBar({
  count,
  tags,
  onClear,
  onAddTag,
  onRemoveTag,
  onChangeStage,
  onArchive,
  onDelete,
}: BulkActionsBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 px-4 py-2.5">
      <button
        type="button"
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium">{t('contacts.selected', { count })}</span>

      <div className="flex items-center gap-2 ml-auto">
        {/* Tag menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {t('contacts.bulk.tag')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* Add tags group */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">{t('contacts.tag.add')}</DropdownMenuLabel>
              {tags.map((tag) => (
                <DropdownMenuItem key={`add-${tag.id}`} onClick={() => onAddTag(tag.id)}>
                  {tag.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            {tags.length > 0 && <DropdownMenuSeparator />}
            {/* Remove tags group */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">{t('contacts.tag.remove')}</DropdownMenuLabel>
              {tags.map((tag) => (
                <DropdownMenuItem key={`rm-${tag.id}`} onClick={() => onRemoveTag(tag.id)}>
                  {tag.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Stage menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <LayoutList className="w-3.5 h-3.5" />
              {t('contacts.bulk.stage')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">{t('contacts.bulk.stageTitle')}</DropdownMenuLabel>
              {Object.entries(STAGE_LABELS).map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => onChangeStage(key)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={onArchive}
          className="h-7 text-xs gap-1.5"
        >
          <Archive className="w-3.5 h-3.5" />
          {t('contacts.bulk.archive')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t('contacts.bulk.delete')}
        </Button>
      </div>
    </div>
  )
}
