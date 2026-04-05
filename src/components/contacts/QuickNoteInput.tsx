import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface QuickNoteInputProps {
  onSubmit: (content: string) => Promise<void>
  disabled?: boolean
}

export function QuickNoteInput({ onSubmit, disabled }: QuickNoteInputProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || loading) return

    setLoading(true)
    try {
      await onSubmit(value.trim())
      setValue('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Hızlı not ekle..."
        rows={2}
        disabled={disabled || loading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e as unknown as React.FormEvent)
        }}
        className="resize-none flex-1 text-sm"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!value.trim() || loading || disabled}
        className="shrink-0 self-end"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  )
}
