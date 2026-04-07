import { useTranslation } from 'react-i18next'
import { format, isSameDay, parseISO, addDays, eachDayOfInterval } from 'date-fns'
import { MapPin, Video, Phone, Coffee, Users, Calendar, Bell, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLocale, fmtTime, relativeDay, isToday } from '@/lib/calendar/dateHelpers'
import { APPOINTMENT_TYPE_COLORS, PRIORITY_COLORS } from '@/lib/calendar/constants'
import type { AppointmentWithContact, FollowUpWithContact } from '@/lib/calendar/types'

const APT_ICONS = { meeting: Users, call: Phone, video_call: Video, presentation: Users, coffee: Coffee, event: Calendar, other: Calendar }

interface Props {
  currentDate: Date
  appointments: AppointmentWithContact[]
  followUps: FollowUpWithContact[]
  onAddAppointment: () => void
  onAppointmentClick?: (apt: AppointmentWithContact) => void
}

export function CalendarAgendaView({ currentDate, appointments, followUps, onAddAppointment, onAppointmentClick }: Props) {
  const { t } = useTranslation()
  const locale = getLocale()

  const days = eachDayOfInterval({ start: currentDate, end: addDays(currentDate, 29) })

  const hasAnything = days.some(day => {
    const dayAppts = appointments.filter(a => isSameDay(parseISO(a.starts_at), day))
    const dayFups  = followUps.filter(f => isSameDay(parseISO(f.due_at), day) && f.status === 'pending')
    return dayAppts.length > 0 || dayFups.length > 0
  })

  if (!hasAnything) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">{t('calendar.emptyAgenda')}</p>
        <button onClick={onAddAppointment} className="mt-4 text-sm text-primary hover:underline">
          + {t('calendar.newAppointment')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1 overflow-y-auto">
      {days.map(day => {
        const dayAppts = appointments.filter(a => isSameDay(parseISO(a.starts_at), day))
        const dayFups  = followUps.filter(f => isSameDay(parseISO(f.due_at), day) && f.status === 'pending')
        if (dayAppts.length === 0 && dayFups.length === 0) return null

        return (
          <div key={day.toISOString()}>
            {/* Day header */}
            <div className={cn(
              'sticky top-0 flex items-center gap-3 px-4 py-2 text-sm font-semibold border-b bg-background/95 backdrop-blur-sm z-10',
              isToday(day) && 'text-primary'
            )}>
              <span>{relativeDay(day, t)}</span>
              {isToday(day) && <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-normal">{t('calendar.today')}</span>}
            </div>

            <div className="divide-y">
              {/* Appointments */}
              {dayAppts.map(apt => {
                const Icon = APT_ICONS[apt.type] ?? Calendar
                const colors = APPOINTMENT_TYPE_COLORS[apt.type]
                return (
                  <div
                    key={apt.id}
                    onClick={() => onAppointmentClick?.(apt)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className={cn('flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5', colors)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{apt.title}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        {!apt.all_day && (
                          <span>{fmtTime(apt.starts_at)} – {fmtTime(apt.ends_at)}</span>
                        )}
                        {apt.contact && <span>{apt.contact.full_name}</span>}
                        {apt.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />{apt.location}
                          </span>
                        )}
                        {apt.meeting_url && (
                          <span className="flex items-center gap-0.5 text-primary">
                            <Video className="w-3 h-3" />{t('calendar.appointment.online')}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                )
              })}

              {/* Follow-ups */}
              {dayFups.map(fu => (
                <div
                  key={fu.id}
                  onClick={() => {}}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fu.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{fu.contact.full_name}</span>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full', PRIORITY_COLORS[fu.priority])}>
                        {t(`followUps.priority.${fu.priority}`)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
