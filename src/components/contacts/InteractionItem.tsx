import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  StickyNote, Phone, MessageCircle, Send, Mail, MessageSquare,
  Coffee, Presentation, AlertCircle, ArrowRight, Thermometer, Settings,
} from 'lucide-react'
import { INTERACTION_TYPE_LABELS } from '@/lib/contacts/constants'
import type { Interaction } from '@/types/database'
import { cn } from '@/lib/utils'

const ICONS: Record<string, React.ElementType> = {
  note: StickyNote,
  call: Phone,
  whatsapp: MessageCircle,
  telegram: Send,
  email: Mail,
  sms: MessageSquare,
  meeting: Coffee,
  presentation: Presentation,
  objection: AlertCircle,
  stage_change: ArrowRight,
  warmth_change: Thermometer,
  system: Settings,
}

const TYPE_COLORS: Record<string, string> = {
  note: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  call: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  whatsapp: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  telegram: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  email: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  sms: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  meeting: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  presentation: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  objection: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  stage_change: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  warmth_change: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  system: 'bg-muted text-muted-foreground',
}

interface InteractionItemProps {
  interaction: Interaction
}

export function InteractionItem({ interaction }: InteractionItemProps) {
  const Icon = ICONS[interaction.type] ?? StickyNote
  const colorClass = TYPE_COLORS[interaction.type] ?? TYPE_COLORS['note']
  const label = INTERACTION_TYPE_LABELS[interaction.type]

  return (
    <div className="flex gap-3">
      {/* Icon */}
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5', colorClass)}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">
            {interaction.subject || label}
          </span>
          {interaction.warmth_impact !== 0 && (
            <span className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              interaction.warmth_impact > 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}>
              {interaction.warmth_impact > 0 ? '+' : ''}{interaction.warmth_impact}
            </span>
          )}
          <time className="text-xs text-muted-foreground ml-auto">
            {format(new Date(interaction.occurred_at), 'd MMM yyyy HH:mm', { locale: tr })}
          </time>
        </div>
        {interaction.content && (
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
            {interaction.content}
          </p>
        )}
      </div>
    </div>
  )
}
