import { Filter, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { STAGE_LABELS, SOURCE_LABELS, CONTACT_TYPE_LABELS } from '@/lib/contacts/constants'
import type { ContactFilters } from '@/lib/contacts/types'
import type { Tag } from '@/types/database'
import { TagChip } from './TagChip'
import { cn } from '@/lib/utils'

interface ContactFiltersProps {
  filters: ContactFilters
  tags: Tag[]
  onChange: (updates: Partial<ContactFilters>) => void
  onReset: () => void
  hasActive: boolean
  className?: string
}

function MultiToggle({
  options,
  values,
  onChange,
}: {
  options: Record<string, string>
  values: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (key: string) => {
    const next = values.includes(key) ? values.filter((v) => v !== key) : [...values, key]
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(options).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => toggle(key)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
            values.includes(key)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent text-muted-foreground border-border hover:border-primary hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function ContactFilters({
  filters,
  tags,
  onChange,
  onReset,
  hasActive,
  className,
}: ContactFiltersProps) {
  const { t } = useTranslation()

  const translatedStageLabels = Object.fromEntries(
    Object.keys(STAGE_LABELS).map(k => [k, t(`contactStages.${k}`)])
  )
  const translatedSourceLabels = Object.fromEntries(
    Object.keys(SOURCE_LABELS).map(k => [k, t(`contactSources.${k}`)])
  )
  const translatedTypeLabels = Object.fromEntries(
    Object.keys(CONTACT_TYPE_LABELS).map(k => [k, t(`contactTypes.${k}`)])
  )

  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="w-4 h-4" />
          {t('contacts.filters.title')}
        </div>
        {hasActive && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs gap-1">
            <X className="w-3 h-3" />
            {t('common.reset')}
          </Button>
        )}
      </div>

      {/* Stage */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('contacts.filters.stage')}</p>
        <MultiToggle
          options={translatedStageLabels}
          values={filters.stages}
          onChange={(v) => onChange({ stages: v })}
        />
      </div>

      {/* Contact type */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('contacts.filters.contactType')}</p>
        <MultiToggle
          options={translatedTypeLabels}
          values={filters.contactTypes}
          onChange={(v) => onChange({ contactTypes: v })}
        />
      </div>

      {/* Source */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('contacts.filters.source')}</p>
        <MultiToggle
          options={translatedSourceLabels}
          values={filters.sources}
          onChange={(v) => onChange({ sources: v })}
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('contacts.filters.tags')}</p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  const next = filters.tagIds.includes(tag.id)
                    ? filters.tagIds.filter((id) => id !== tag.id)
                    : [...filters.tagIds, tag.id]
                  onChange({ tagIds: next })
                }}
              >
                <TagChip
                  tag={tag}
                  className={cn(
                    'cursor-pointer transition-opacity',
                    filters.tagIds.includes(tag.id) ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warmth range */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t('contacts.filters.warmth', { min: filters.warmthMin, max: filters.warmthMax })}
        </p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.warmthMin}
            onChange={(e) => onChange({ warmthMin: Number(e.target.value) })}
            className="flex-1 accent-primary"
          />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.warmthMax}
            onChange={(e) => onChange({ warmthMax: Number(e.target.value) })}
            className="flex-1 accent-primary"
          />
        </div>
      </div>

      {/* Switches */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="followup-filter" className="text-xs font-medium cursor-pointer">
            {t('contacts.filters.pendingFollowup')}
          </Label>
          <Switch
            id="followup-filter"
            checked={filters.pendingFollowUp}
            onCheckedChange={(v) => onChange({ pendingFollowUp: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="archived-filter" className="text-xs font-medium cursor-pointer">
            {t('contacts.filters.archived')}
          </Label>
          <Switch
            id="archived-filter"
            checked={filters.archived}
            onCheckedChange={(v) => onChange({ archived: v })}
          />
        </div>
      </div>
    </div>
  )
}
