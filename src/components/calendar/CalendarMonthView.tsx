import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { buildMonthGrid, isSameMonth, isToday, isSameDay } from '@/lib/calendar/dateHelpers'
import { getLocale } from '@/lib/calendar/dateHelpers'
import type { AppointmentWithContact, FollowUpWithContact } from '@/lib/calendar/types'
import { AppointmentBadge } from './AppointmentBadge'
import { Bell } from 'lucide-react'

interface Props {
  currentDate: Date
  appointments: AppointmentWithContact[]
  followUps: FollowUpWithContact[]
  onDayClick: (date: Date) => void
  onAddClick: (date: Date) => void
  onAppointmentClick?: (apt: AppointmentWithContact) => void
}

const WEEKDAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarMonthView({ currentDate, appointments, followUps, onDayClick, onAddClick, onAppointmentClick }: Props) {
  const { t } = useTranslation()
  const locale = getLocale()
  const weeks = buildMonthGrid(currentDate)

  // Weekday headers (Mon–Sun)
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const day = weeks[0][i]
    return format(day, 'EEEEE', { locale }) // single letter: P, S, Ç…
  })

  return (
    <div className="flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b">
        {weekdays.map((d, i) => (
          <div key={i} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-6 min-h-0">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-0 min-h-0">
            {week.map((day, di) => {
              const dayAppts = appointments.filter(a => isSameDay(new Date(a.starts_at), day))
              const dayFups  = followUps.filter(f => isSameDay(new Date(f.due_at), day) && f.status === 'pending')
              const isCurrentMonth = isSameMonth(day, currentDate)
              const today = isToday(day)
              const MAX_VISIBLE = 2
              const hiddenCount = dayAppts.length + (dayFups.length > 0 ? 1 : 0) - MAX_VISIBLE

              return (
                <div
                  key={di}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'border-r last:border-0 p-1 flex flex-col gap-0.5 cursor-pointer hover:bg-muted/30 transition-colors min-h-0 overflow-hidden',
                    !isCurrentMonth && 'opacity-40'
                  )}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      today && 'bg-primary text-primary-foreground font-bold',
                      !today && isCurrentMonth && 'text-foreground',
                    )}>
                      {format(day, 'd')}
                    </span>
                    {/* Follow-up indicator */}
                    {dayFups.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Bell className="w-3 h-3 text-amber-500" />
                        {dayFups.length > 1 && (
                          <span className="text-xs text-amber-500">{dayFups.length}</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Appointment badges (max 2 visible) */}
                  {dayAppts.slice(0, MAX_VISIBLE).map(apt => (
                    <AppointmentBadge key={apt.id} appointment={apt} compact onClick={onAppointmentClick} />
                  ))}

                  {/* Overflow indicator */}
                  {hiddenCount > 0 && (
                    <span className="text-xs text-muted-foreground px-1">+{hiddenCount}</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
