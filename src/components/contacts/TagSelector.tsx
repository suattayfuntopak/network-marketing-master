import { useState, useRef, useEffect } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TagChip } from './TagChip'
import type { Tag } from '@/types/database'
import { TAG_COLOR_CLASSES } from '@/lib/contacts/constants'
import { cn } from '@/lib/utils'

const COLORS = Object.keys(TAG_COLOR_CLASSES) as (keyof typeof TAG_COLOR_CLASSES)[]

interface TagSelectorProps {
  allTags: Tag[]
  selectedTagIds: string[]
  onToggle: (tagId: string) => void
  onCreateTag?: (name: string, color: string) => Promise<void>
  userId?: string
  disabled?: boolean
  creationMode?: 'browse' | 'direct'
}

export function TagSelector({
  allTags,
  selectedTagIds,
  onToggle,
  onCreateTag,
  disabled,
  creationMode = 'browse',
}: TagSelectorProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>('emerald')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedTags = allTags.filter((tg) => selectedTagIds.includes(tg.id))
  const availableTags = allTags.filter((tg) => !selectedTagIds.includes(tg.id))
  const filtered = allTags.filter((tg) =>
    tg.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        setNewName('')
        setNewColor('emerald')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreate = async () => {
    if (!newName.trim() || !onCreateTag) return

    const existingTag = allTags.find((tag) => tag.name.trim().toLowerCase() === newName.trim().toLowerCase())
    if (existingTag) {
      if (!selectedTagIds.includes(existingTag.id)) {
        onToggle(existingTag.id)
      }
      setNewName('')
      setSearch('')
      return
    }

    setLoading(true)
    try {
      await onCreateTag(newName.trim(), newColor)
      setNewName('')
      setNewColor('emerald')
      setSearch('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {selectedTags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            onRemove={disabled ? undefined : () => onToggle(tag.id)}
          />
        ))}
        {!disabled && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-3 h-3" />
            {t('contacts.tag.add')}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="relative z-50">
          <div className="absolute top-0 left-0 w-72 rounded-lg border border-border bg-popover shadow-md p-2 space-y-2">
            {creationMode === 'browse' ? (
              <>
                <Input
                  placeholder={t('contacts.tag.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus
                />

                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {filtered.length === 0 && (
                    <p className="text-xs text-muted-foreground px-2 py-1">
                      {search ? t('contacts.tag.notFound') : t('contacts.tag.empty')}
                    </p>
                  )}
                  {filtered.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => onToggle(tag.id)}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent text-sm text-left"
                      >
                        <Check className={cn('w-3.5 h-3.5', isSelected ? 'opacity-100' : 'opacity-0')} />
                        <TagChip tag={tag} />
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}

            {onCreateTag ? (
              <div className={cn('space-y-2', creationMode === 'browse' && 'border-t border-border pt-2')}>
                <Input
                  placeholder={t('contacts.tag.namePlaceholder')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleCreate()
                    }
                  }}
                  autoFocus={creationMode === 'direct'}
                />
                <div className="flex flex-wrap gap-1">
                  {COLORS.map((c) => {
                    const cls = TAG_COLOR_CLASSES[c]
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 transition-transform',
                          cls.bg,
                          newColor === c ? 'border-foreground scale-110' : 'border-transparent'
                        )}
                      />
                    )
                  })}
                </div>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => void handleCreate()}
                    disabled={!newName.trim() || loading}
                  >
                    {t('common.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setOpen(false)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : null}

            {creationMode === 'direct' ? (
              <div className="border-t border-border pt-2">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t('contacts.tag.existing')}
                </p>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {availableTags.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-muted-foreground">{t('contacts.tag.empty')}</p>
                  ) : (
                    availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => onToggle(tag.id)}
                        className="w-full rounded-md px-2 py-1 text-left hover:bg-accent"
                      >
                        <TagChip tag={tag} />
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
