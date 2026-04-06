import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Video, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtTime } from '@/lib/calendar/dateHelpers'
import { APPOINTMENT_TYPE_COLORS } from '@/lib/calendar/constants'
import type { AppointmentWithContact } from '@/lib/calendar/types'
import { ROUTES } from '@/lib/constants'

interface Props {
  appointment: AppointmentWithContact
  /** compact = small pill used in week/day grid blocks */
  compact?: boolean
  style?: React.CSSProperties
  className?: string
}

export function AppointmentCard({ appointment, compact, style, className }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const colors = APPOINTMENT_TYPE_COLORS[appointment.type] ?? APPOINTMENT_TYPE_COLORS.other

  if (compact) {
    return (
      <div
        onClick={() => navigate(`${ROUTES.CALENDAR}/${appointment.id}`)}
        style={style}
        className={cn(
          'absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 text-xs cursor-pointer overflow-hidden',
          colors,
          className,
        )}
        title={appointment.title}
      >
        <p className="font-medium truncate leading-4">{appointment.title}</p>
        {!appointment.all_day && (
          <p className="opacity-80 truncate text-[10px]">{fmtTime(appointment.starts_at)} – {fmtTime(appointment.ends_at)}</p>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => navigate(`${ROUTES.CALENDAR}/${appointment.id}`)}
      className={cn(
        'rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-shadow',
        colors,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{appointment.title}</p>
          {appointment.contact && (
            <p className="text-xs opacity-80 truncate">{appointment.contact.full_name}</p>
          )}
        </div>
        <span className="text-xs opacity-70 shrink-0">
          {t(`calendar.appointment.types.${appointment.type}`)}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-1.5 text-xs opacity-80 flex-wrap">
        {!appointment.all_day && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fmtTime(appointment.starts_at)} – {fmtTime(appointment.ends_at)}
          </span>
        )}
        {appointment.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {appointment.location}
          </span>
        )}
        {appointment.meeting_url && (
          <span className="flex items-center gap-1">
            <Video className="w-3 h-3" />
            {t('calendar.appointment.online')}
          </span>
        )}
      </div>
    </div>
  )
}
