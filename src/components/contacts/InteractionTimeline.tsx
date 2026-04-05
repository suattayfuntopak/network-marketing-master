import { useTranslation } from 'react-i18next'
import { InteractionItem } from './InteractionItem'
import type { Interaction } from '@/types/database'

interface InteractionTimelineProps {
  interactions: Interaction[]
  loading?: boolean
}

export function InteractionTimeline({ interactions, loading }: InteractionTimelineProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground whitespace-pre-line">
        {t('contacts.interaction.empty')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction, idx) => (
        <div key={interaction.id} className="relative">
          {idx < interactions.length - 1 && (
            <div className="absolute left-4 top-8 w-px h-full bg-border -translate-x-1/2" />
          )}
          <InteractionItem interaction={interaction} />
        </div>
      ))}
    </div>
  )
}
