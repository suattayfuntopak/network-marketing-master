import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Bell, CalendarDays, List, CalendarRange, Calendar, Activity, ShieldAlert, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useAppointments, useFollowUps } from '@/hooks/useCalendar'
import { useNotifications, useAppointmentNotifications } from '@/hooks/useNotifications'
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView'
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView'
import { CalendarDayView } from '@/components/calendar/CalendarDayView'
import { CalendarAgendaView } from '@/components/calendar/CalendarAgendaView'
import { NewAppointmentModal } from '@/components/calendar/modals/NewAppointmentModal'
import { NewFollowUpModal } from '@/components/calendar/modals/NewFollowUpModal'
import {
  fmtMonthYear, fmtWeekRange, fmtDayFull,
  prevMonth, nextMonth,
  prevWeek, nextWeek,
  prevDay, nextDay,
} from '@/lib/calendar/dateHelpers'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { ROUTES } from '@/lib/constants'
import { buildFollowUpInsights } from '@/lib/calendar/followUpInsights'
import type { AppointmentWithContact, FollowUpWithContact } from '@/lib/calendar/types'

type CalendarView = 'month' | 'week' | 'day' | 'agenda'

const VIEWS: { key: CalendarView; icon: React.ElementType; labelKey: string }[] = [
  { key: 'month',  icon: CalendarDays,  labelKey: 'calendar.views.month' },
  { key: 'week',   icon: CalendarRange, labelKey: 'calendar.views.week' },
  { key: 'day',    icon: Calendar,      labelKey: 'calendar.views.day' },
  { key: 'agenda', icon: List,          labelKey: 'calendar.views.agenda' },
]

export function CalendarPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [editAppointment, setEditAppointment] = useState<AppointmentWithContact | null>(null)
  const [editFollowUp, setEditFollowUp] = useState<FollowUpWithContact | null>(null)

  const { requestPermission, permission } = useNotifications()

  // Derive fetch range based on view
  const from = view === 'week'
    ? startOfWeek(currentDate, { weekStartsOn: 1 })
    : view === 'day'
    ? currentDate
    : startOfMonth(currentDate)
  const to = view === 'week'
    ? endOfWeek(currentDate, { weekStartsOn: 1 })
    : view === 'day'
    ? currentDate
    : endOfMonth(addDays(currentDate, 35))

  const { data: appointments = [] } = useAppointments(userId, from, to)
  const { data: followUps = [] } = useFollowUps(userId, ['pending', 'snoozed'])
  const calendarFollowUpInsights = buildFollowUpInsights({
    all: followUps,
    today: followUps.filter((item) => {
      const date = new Date(item.due_at)
      const now = new Date()
      return date.toDateString() === now.toDateString()
    }),
    tomorrow: followUps.filter((item) => {
      const date = new Date(item.due_at)
      const tomorrow = addDays(new Date(), 1)
      return date.toDateString() === tomorrow.toDateString()
    }),
    thisWeek: followUps.filter((item) => {
      const date = new Date(item.due_at).getTime()
      const start = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime()
      const end = endOfWeek(new Date(), { weekStartsOn: 1 }).getTime()
      return date >= start && date <= end
    }),
    overdue: followUps.filter((item) => new Date(item.due_at) < new Date()),
    completed: [],
  })

  // Poll for appointment reminders
  useAppointmentNotifications(appointments)

  // Request notification permission on first visit
  useEffect(() => {
    if (permission === 'default') {
      const timer = setTimeout(() => requestPermission(), 2000)
      return () => clearTimeout(timer)
    }
  }, [permission, requestPermission])

  const handleAppointmentClick = (apt: AppointmentWithContact) => {
    setEditAppointment(apt)
    setShowAppointmentModal(true)
  }

  const handlePrev = () => {
    if (view === 'month' || view === 'agenda') setCurrentDate(prevMonth(currentDate))
    else if (view === 'week') setCurrentDate(prevWeek(currentDate))
    else setCurrentDate(prevDay(currentDate))
  }

  const handleNext = () => {
    if (view === 'month' || view === 'agenda') setCurrentDate(nextMonth(currentDate))
    else if (view === 'week') setCurrentDate(nextWeek(currentDate))
    else setCurrentDate(nextDay(currentDate))
  }

  const getTitle = () => {
    if (view === 'week') return fmtWeekRange(currentDate)
    if (view === 'day')  return fmtDayFull(currentDate)
    return fmtMonthYear(currentDate)
  }

  const handleDayClick = (date: Date) => {
    setCurrentDate(date)
    setView('day')
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={handlePrev} className="p-1 rounded-md hover:bg-muted transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold truncate capitalize min-w-0 max-w-[200px] md:max-w-none">
            {getTitle()}
          </h2>
          <button onClick={handleNext} className="p-1 rounded-md hover:bg-muted transition-colors shrink-0">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs px-2 py-1 rounded-md border hover:bg-muted transition-colors ml-1 shrink-0"
          >
            {t('calendar.today')}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View switcher */}
          <div className="flex items-center border rounded-md overflow-hidden">
            {VIEWS.map((v, i) => {
              const Icon = v.icon
              return (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={cn(
                    'px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors',
                    i > 0 && 'border-l',
                    view === v.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t(v.labelKey)}</span>
                </button>
              )
            })}
          </div>

          {/* Follow-ups link */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)}
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('followUps.pageTitle')}</span>
          </Button>

          {/* New appointment */}
          <Button
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => {
              setEditAppointment(null)
              setSelectedDate(undefined)
              setShowAppointmentModal(true)
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('calendar.newAppointment')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-b px-4 py-3 md:grid-cols-3 shrink-0">
        {[
          {
            key: 'stabilize',
            Icon: ShieldAlert,
            value: calendarFollowUpInsights.overdue,
            hint: t('calendar.pulse.stabilize', { count: calendarFollowUpInsights.overdue }),
          },
          {
            key: 'deliver',
            Icon: Zap,
            value: calendarFollowUpInsights.dueToday,
            hint: t('calendar.pulse.deliver', { count: calendarFollowUpInsights.dueToday }),
          },
          {
            key: 'rhythm',
            Icon: Activity,
            value: `${calendarFollowUpInsights.touchCoverage}%`,
            hint: t('calendar.pulse.rhythm', { coverage: calendarFollowUpInsights.touchCoverage }),
          },
        ].map(({ key, Icon, value, hint }) => (
          <div key={key} className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">{t(`followUps.planner.cards.${key}.title`)}</p>
              </div>
              <span className="text-lg font-semibold tabular-nums">{value}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      {/* Calendar body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'month' && (
          <CalendarMonthView
            currentDate={currentDate}
            appointments={appointments}
            followUps={followUps}
            onDayClick={handleDayClick}
            onAddClick={(date) => { setSelectedDate(date); setShowAppointmentModal(true) }}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {view === 'week' && (
          <CalendarWeekView
            currentDate={currentDate}
            appointments={appointments}
            followUps={followUps}
            onDayClick={handleDayClick}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {view === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            appointments={appointments}
            followUps={followUps}
            userId={userId}
            onEditFollowUp={(fu) => { setEditFollowUp(fu); setShowFollowUpModal(true) }}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {view === 'agenda' && (
          <CalendarAgendaView
            currentDate={currentDate}
            appointments={appointments}
            followUps={followUps}
            onAddAppointment={() => setShowAppointmentModal(true)}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
      </div>

      {/* Modals */}
      <NewAppointmentModal
        open={showAppointmentModal}
        onClose={() => { setShowAppointmentModal(false); setEditAppointment(null) }}
        userId={userId}
        defaultDate={selectedDate}
        editAppointment={editAppointment}
      />
      <NewFollowUpModal
        open={showFollowUpModal}
        onClose={() => { setShowFollowUpModal(false); setEditFollowUp(null) }}
        userId={userId}
        editFollowUp={editFollowUp}
      />
    </div>
  )
}
