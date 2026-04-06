import { cn } from '@/lib/utils'
import { APPOINTMENT_DOT_COLORS } from '@/lib/calendar/constants'
import { fmtTime } from '@/lib/calendar/dateHelpers'
import type { AppointmentWithContact } from '@/lib/calendar/types'

interface Props {
  appointment: AppointmentWithContact
  compact?: boolean
  onClick?: (appointment: AppointmentWithContact) => void
}

export function AppointmentBadge({ appointment, compact, onClick }: Props) {
  const dot = APPOINTMENT_DOT_COLORS[appointment.type] ?? 'bg-blue-500'

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(appointment) }}
      className={cn(
        'w-full text-left rounded px-1 py-0.5 text-xs flex items-center gap-1 hover:opacity-80 transition-opacity truncate',
        'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
      )}
      title={appointment.title}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {!compact && !appointment.all_day && (
        <span className="shrink-0 opacity-70">{fmtTime(appointment.starts_at)}</span>
      )}
      <span className="truncate">{appointment.title}</span>
    </button>
  )
}
