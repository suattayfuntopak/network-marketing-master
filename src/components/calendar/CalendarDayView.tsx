import { useTranslation } from 'react-i18next'
import { parseISO, isSameDay, differenceInMinutes } from 'date-fns'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtDayFull } from '@/lib/calendar/dateHelpers'
import { AppointmentCard } from './AppointmentCard'
import { FollowUpItem } from './FollowUpItem'
import type { AppointmentWithContact, FollowUpWithContact } from '@/lib/calendar/types'

const HOUR_START = 7
const HOUR_END   = 21
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)
const HOUR_PX = 56

function aptTop(apt: AppointmentWithContact) {
  const s = parseISO(apt.starts_at)
  return Math.max(0, (s.getHours() - HOUR_START) * 60 + s.getMinutes()) * HOUR_PX / 60
}
function aptHeight(apt: AppointmentWithContact) {
  return Math.max(20, differenceInMinutes(parseISO(apt.ends_at), parseISO(apt.starts_at)) * HOUR_PX / 60)
}

interface Props {
  currentDate: Date
  appointments: AppointmentWithContact[]
  followUps: FollowUpWithContact[]
  userId: string
  onEditFollowUp: (fu: FollowUpWithContact) => void
}

export function CalendarDayView({ currentDate, appointments, followUps, userId, onEditFollowUp }: Props) {
  const { t } = useTranslation()
  const dayApts = appointments.filter(a => isSameDay(parseISO(a.starts_at), currentDate))
  const dayFups = followUps.filter(f => isSameDay(parseISO(f.due_at), currentDate) && f.status === 'pending')
  const allDayApts = dayApts.filter(a => a.all_day)
  const timedApts  = dayApts.filter(a => !a.all_day)
  const gridH = HOURS.length * HOUR_PX

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day header */}
      <div className="px-4 py-2.5 border-b shrink-0">
        <h3 className="text-sm font-semibold capitalize">{fmtDayFull(currentDate)}</h3>
      </div>

      {/* Follow-ups for this day */}
      {dayFups.length > 0 && (
        <div className="border-b px-4 py-2 shrink-0 bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
            <Bell className="w-3.5 h-3.5" />
            {t('followUps.pageTitle')} ({dayFups.length})
          </div>
          <div className="space-y-1.5">
            {dayFups.map(fu => (
              <FollowUpItem key={fu.id} followUp={fu} userId={userId} onEdit={onEditFollowUp} />
            ))}
          </div>
        </div>
      )}

      {/* All-day appointments */}
      {allDayApts.length > 0 && (
        <div className="border-b px-4 py-2 shrink-0 space-y-1">
          {allDayApts.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))}
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridH }}>
          {/* Hour labels */}
          <div className="w-14 shrink-0 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 flex justify-end"
                style={{ top: (h - HOUR_START) * HOUR_PX - 8 }}
              >
                <span className="text-[10px] text-muted-foreground">{`${String(h).padStart(2, '0')}:00`}</span>
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className="flex-1 relative border-l" style={{ height: gridH }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border/40"
                style={{ top: (h - HOUR_START) * HOUR_PX }}
              />
            ))}

            {/* Current time */}
            {isSameDay(currentDate, new Date()) && (() => {
              const now = new Date()
              const top = (now.getHours() - HOUR_START) * HOUR_PX + now.getMinutes() * HOUR_PX / 60
              return top >= 0 ? (
                <div className="absolute left-0 right-0 flex items-center z-10 pointer-events-none" style={{ top }}>
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                  <div className="flex-1 border-t-2 border-red-500" />
                </div>
              ) : null
            })()}

            {timedApts.map(apt => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                compact
                style={{ top: aptTop(apt), height: aptHeight(apt) }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
