import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ContactSearchBarProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ContactSearchBar({ value, onChange, className }: ContactSearchBarProps) {
  const { t } = useTranslation()
  const [local, setLocal] = useState(value)

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local)
    }, 300)
    return () => clearTimeout(timer)
  }, [local, onChange, value])

  // Sync if external changes
  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={t('contacts.searchPlaceholder')}
        className="pl-9 pr-9"
      />
      {local && (
        <button
          type="button"
          onClick={() => { setLocal(''); onChange('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
