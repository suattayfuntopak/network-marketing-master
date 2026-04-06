import { useTranslation } from 'react-i18next'
import { format, isSameDay, parseISO, differenceInMinutes } from 'date-fns'
import { cn } from '@/lib/utils'
import { buildWeekDays, getLocale, fmtTime, isToday } from '@/lib/calendar/dateHelpers'
import { AppointmentCard } from './AppointmentCard'
import { Bell } from 'lucide-react'
import type { AppointmentWithContact, FollowUpWithContact } from '@/lib/calendar/types'

const HOUR_START = 7   // 07:00
const HOUR_END   = 21  // 21:00
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)
const HOUR_PX = 56     // pixels per hour

interface Props {
  currentDate: Date
  appointments: AppointmentWithContact[]
  followUps: FollowUpWithContact[]
  onDayClick: (date: Date) => void
  onAppointmentClick?: (apt: AppointmentWithContact) => void
}

function aptTopPct(apt: AppointmentWithContact): number {
  const start = parseISO(apt.starts_at)
  const minutesFromTop = (start.getHours() - HOUR_START) * 60 + start.getMinutes()
  return Math.max(0, minutesFromTop) * HOUR_PX / 60
}

function aptHeightPx(apt: AppointmentWithContact): number {
  const start = parseISO(apt.starts_at)
  const end   = parseISO(apt.ends_at)
  const dur   = differenceInMinutes(end, start)
  return Math.max(18, dur * HOUR_PX / 60)
}

export function CalendarWeekView({ currentDate, appointments, followUps, onDayClick, onAppointmentClick }: Props) {
  const { t } = useTranslation()
  const locale = getLocale()
  const days = buildWeekDays(currentDate)
  const gridH = HOURS.length * HOUR_PX

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day header row */}
      <div className="flex border-b shrink-0">
        {/* Gutter */}
        <div className="w-14 shrink-0" />
        {days.map((day) => {
          const today = isToday(day)
          const dayFups = followUps.filter(f => isSameDay(parseISO(f.due_at), day) && f.status === 'pending')
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex-1 text-center py-2 border-l cursor-pointer hover:bg-muted/30 transition-colors',
                today && 'bg-primary/5'
              )}
              onClick={() => onDayClick(day)}
            >
              <p className="text-xs text-muted-foreground">
                {format(day, 'EEE', { locale })}
              </p>
              <div className="flex items-center justify-center gap-1">
                <span className={cn(
                  'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full',
                  today && 'bg-primary text-primary-foreground'
                )}>
                  {format(day, 'd')}
                </span>
                {dayFups.length > 0 && (
                  <Bell className="w-3 h-3 text-amber-500" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridH }}>
          {/* Hour labels */}
          <div className="w-14 shrink-0 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 flex justify-end pr-2"
                style={{ top: (h - HOUR_START) * HOUR_PX - 8 }}
              >
                <span className="text-[10px] text-muted-foreground">{`${String(h).padStart(2, '0')}:00`}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayApts = appointments.filter(a =>
              !a.all_day && isSameDay(parseISO(a.starts_at), day)
            )
            return (
              <div
                key={day.toISOString()}
                className="flex-1 relative border-l"
                style={{ height: gridH }}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-border/40"
                    style={{ top: (h - HOUR_START) * HOUR_PX }}
                  />
                ))}

                {/* Current time indicator */}
                {isToday(day) && (() => {
                  const now = new Date()
                  const top = (now.getHours() - HOUR_START) * HOUR_PX + now.getMinutes() * HOUR_PX / 60
                  return top >= 0 && top <= gridH ? (
                    <div
                      className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
                      style={{ top }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                      <div className="flex-1 border-t-2 border-red-500" />
                    </div>
                  ) : null
                })()}

                {/* Appointments */}
                {dayApts.map(apt => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    compact
                    style={{ top: aptTopPct(apt), height: aptHeightPx(apt) }}
                    onClick={onAppointmentClick}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
