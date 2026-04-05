import { useState, useRef, useEffect } from 'react'
import { Plus, Check, X } from 'lucide-react'
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
}

export function TagSelector({
  allTags,
  selectedTagIds,
  onToggle,
  onCreateTag,
  disabled,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>('emerald')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id))
  const filtered = allTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreate = async () => {
    if (!newName.trim() || !onCreateTag) return
    setLoading(true)
    try {
      await onCreateTag(newName.trim(), newColor)
      setNewName('')
      setNewColor('emerald')
      setCreating(false)
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
            Etiket ekle
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="relative z-50">
          <div className="absolute top-0 left-0 w-64 rounded-lg border border-border bg-popover shadow-md p-2 space-y-2">
            <Input
              placeholder="Etiket ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-xs"
              autoFocus
            />

            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1">
                  {search ? 'Etiket bulunamadı' : 'Henüz etiket yok'}
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

            {onCreateTag && (
              <div className="border-t border-border pt-2">
                {!creating ? (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline w-full px-2"
                  >
                    <Plus className="w-3 h-3" />
                    Yeni etiket oluştur
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Etiket adı"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-7 text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      autoFocus
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
                        className="h-6 text-xs flex-1"
                        onClick={handleCreate}
                        disabled={!newName.trim() || loading}
                      >
                        Oluştur
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => { setCreating(false); setNewName('') }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
