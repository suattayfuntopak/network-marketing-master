import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow, parseISO, addMinutes, addHours, addDays } from 'date-fns'
import {
  Phone, MessageCircle, Mail, MapPin, Send, Eye, MoreHorizontal,
  CheckCircle2, Clock, Pencil, Trash2, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLocale } from '@/lib/calendar/dateHelpers'
import { PRIORITY_COLORS, PRIORITY_DOT } from '@/lib/calendar/constants'
import { useCompleteFollowUp, useSnoozeFollowUp, useDeleteFollowUp } from '@/hooks/useCalendar'
import type { FollowUpWithContact } from '@/lib/calendar/types'

const ACTION_ICONS = {
  call:      Phone,
  message:   MessageCircle,
  email:     Mail,
  visit:     MapPin,
  send_info: Send,
  check_in:  Eye,
  other:     MoreHorizontal,
}

const SNOOZE_OPTIONS = [
  { key: '30min',    getDate: () => addMinutes(new Date(), 30) },
  { key: '1hour',    getDate: () => addHours(new Date(), 1) },
  { key: 'tomorrow', getDate: () => addDays(new Date(), 1) },
  { key: '3days',    getDate: () => addDays(new Date(), 3) },
] as const

interface Props {
  followUp: FollowUpWithContact
  userId: string
  onEdit: (fu: FollowUpWithContact) => void
}

export function FollowUpItem({ followUp, userId, onEdit }: Props) {
  const { t } = useTranslation()
  const locale = getLocale()
  const [showSnooze, setShowSnooze] = useState(false)

  const completeFollowUp = useCompleteFollowUp(userId)
  const snoozeFollowUp   = useSnoozeFollowUp(userId)
  const deleteFollowUp   = useDeleteFollowUp(userId)

  const Icon = ACTION_ICONS[followUp.action_type] ?? MoreHorizontal
  const isCompleted = followUp.status === 'completed'
  const isOverdue = followUp.status === 'pending' && new Date(followUp.due_at) < new Date()

  const initials = followUp.contact.full_name
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border transition-all',
      isCompleted && 'opacity-50',
      isOverdue && !isCompleted && 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10',
    )}>
      {/* Complete checkbox */}
      <button
        onClick={() => !isCompleted && completeFollowUp.mutate(followUp.id)}
        disabled={isCompleted || completeFollowUp.isPending}
        className={cn(
          'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-muted-foreground/40 hover:border-primary'
        )}
      >
        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
      </button>

      {/* Contact avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('text-sm font-medium truncate', isCompleted && 'line-through')}>{followUp.title}</p>
            <p className="text-xs text-muted-foreground truncate">{followUp.contact.full_name}</p>
          </div>
          {/* Actions */}
          {!isCompleted && (
            <div className="flex items-center gap-1 shrink-0">
              {/* Snooze */}
              <div className="relative">
                <button
                  onClick={() => setShowSnooze(!showSnooze)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={t('followUps.actions.snooze')}
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
                {showSnooze && (
                  <div className="absolute right-0 top-8 z-50 bg-popover border rounded-md shadow-md p-1 w-36 text-sm">
                    {SNOOZE_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { snoozeFollowUp.mutate({ id: followUp.id, until: opt.getDate() }); setShowSnooze(false) }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-muted transition-colors"
                      >
                        {t(`followUps.snooze.${opt.key}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => onEdit(followUp)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { if (confirm(t('followUps.deleteConfirm'))) deleteFollowUp.mutate(followUp.id) }}
                className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Icon className="w-3 h-3" />
            <span>{t(`followUps.actionTypes.${followUp.action_type}`)}</span>
          </div>
          <span className={cn('text-xs px-1.5 py-0.5 rounded-full', PRIORITY_COLORS[followUp.priority])}>
            {t(`followUps.priority.${followUp.priority}`)}
          </span>
          <span className={cn('text-xs', isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
            {formatDistanceToNow(parseISO(followUp.due_at), { addSuffix: true, locale })}
          </span>
        </div>

        {followUp.notes && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{followUp.notes}</p>
        )}
      </div>
    </div>
  )
}
