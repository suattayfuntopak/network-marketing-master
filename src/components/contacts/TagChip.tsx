import { X } from 'lucide-react'
import { TAG_COLOR_CLASSES } from '@/lib/contacts/constants'
import type { Tag } from '@/types/database'
import { cn } from '@/lib/utils'
import i18n from '@/i18n'

// System/demo tags that have translations.
// Keys are the Turkish canonical names stored in DB.
const SYSTEM_TAG_TRANSLATIONS: Record<string, { tr: string; en: string }> = {
  'VIP':            { tr: 'VIP',           en: 'VIP' },
  'Yakın Çevre':    { tr: 'Yakın Çevre',   en: 'Inner Circle' },
  'Sıcak Lead':     { tr: 'Sıcak Lead',    en: 'Hot Lead' },
  'Soğuk Lead':     { tr: 'Soğuk Lead',    en: 'Cold Lead' },
  'Ürün Odaklı':    { tr: 'Ürün Odaklı',   en: 'Product Focused' },
  'İş Odaklı':      { tr: 'İş Odaklı',     en: 'Business Focused' },
  'Takip Gerekli':  { tr: 'Takip Gerekli', en: 'Needs Follow-up' },
  'Yeni Üye':       { tr: 'Yeni Üye',      en: 'New Member' },
  'Aktif':          { tr: 'Aktif',         en: 'Active' },
  'Pasif':          { tr: 'Pasif',         en: 'Inactive' },
}

interface TagChipProps {
  tag: Tag
  onRemove?: () => void
  className?: string
}

export function TagChip({ tag, onRemove, className }: TagChipProps) {
  const colors = TAG_COLOR_CLASSES[tag.color] ?? TAG_COLOR_CLASSES['gray']
  const lang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const displayName = SYSTEM_TAG_TRANSLATIONS[tag.name]?.[lang] ?? tag.name

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
      {displayName}
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
