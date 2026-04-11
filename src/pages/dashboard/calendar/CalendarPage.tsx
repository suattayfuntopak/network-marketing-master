import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Bell, CalendarDays, List, CalendarRange, Calendar, Layers3, CalendarClock } from 'lucide-react'
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useAppointments, useFollowUps, useTodayAppointments } from '@/hooks/useCalendar'
import { useNotifications, useAppointmentNotifications } from '@/hooks/useNotifications'
import { CalendarMonthView } from '@/components/calendar/CalendarMonthView'
import { CalendarWeekView } from '@/components/calendar/CalendarWeekView'
import { CalendarDayView } from '@/components/calendar/CalendarDayView'
import { CalendarAgendaView } from '@/components/calendar/CalendarAgendaView'
import { NewAppointmentModal } from '@/components/calendar/modals/NewAppointmentModal'
import { NewFollowUpModal } from '@/components/calendar/modals/NewFollowUpModal'
import {
  fmtMonthYear,
  fmtWeekRange,
  fmtDayFull,
  prevMonth,
  nextMonth,
  prevWeek,
  nextWeek,
  prevDay,
  nextDay,
} from '@/lib/calendar/dateHelpers'
import { ROUTES } from '@/lib/constants'
import type { AppointmentWithContact, FollowUpWithContact } from '@/lib/calendar/types'

type CalendarView = 'month' | 'week' | 'day' | 'agenda'
type SummaryRouteKey = 'all-actions' | 'today-appointments' | 'today-follow-ups'

const VIEW_PATHS: Record<CalendarView, string> = {
  month: ROUTES.CALENDAR,
  week: `${ROUTES.CALENDAR}/hafta`,
  day: `${ROUTES.CALENDAR}/gun`,
  agenda: `${ROUTES.CALENDAR}/gundem`,
}

const VIEW_CONFIG: { key: CalendarView; icon: React.ElementType; labelKey: string; href: string }[] = [
  { key: 'month', icon: CalendarDays, labelKey: 'calendar.views.month', href: VIEW_PATHS.month },
  { key: 'week', icon: CalendarRange, labelKey: 'calendar.views.week', href: VIEW_PATHS.week },
  { key: 'day', icon: Calendar, labelKey: 'calendar.views.day', href: VIEW_PATHS.day },
  { key: 'agenda', icon: List, labelKey: 'calendar.views.agenda', href: VIEW_PATHS.agenda },
]

export function CalendarPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [editAppointment, setEditAppointment] = useState<AppointmentWithContact | null>(null)
  const [editFollowUp, setEditFollowUp] = useState<FollowUpWithContact | null>(null)

  const { requestPermission, permission } = useNotifications()

  const currentDate = useMemo(() => {
    const raw = searchParams.get('date')
    if (!raw) return new Date()
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  }, [searchParams])

  const view: CalendarView = useMemo(() => {
    if (location.pathname.endsWith('/hafta')) return 'week'
    if (location.pathname.endsWith('/gun')) return 'day'
    if (location.pathname.endsWith('/gundem')) return 'agenda'
    return 'month'
  }, [location.pathname])

  const updateDate = (date: Date, nextView = view) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('date', date.toISOString())
    navigate({
      pathname: VIEW_PATHS[nextView],
      search: nextParams.toString(),
    })
  }

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
  const { data: todayAppointments = [] } = useTodayAppointments(userId)

  const todayFollowUps = useMemo(
    () =>
      followUps.filter((item) => {
        const date = new Date(item.due_at)
        const now = new Date()
        return date.toDateString() === now.toDateString()
      }),
    [followUps]
  )

  useAppointmentNotifications(appointments)

  useEffect(() => {
    if (permission === 'default') {
      const timer = setTimeout(() => requestPermission(), 2000)
      return () => clearTimeout(timer)
    }
  }, [permission, requestPermission])

  const handleAppointmentClick = (appointment: AppointmentWithContact) => {
    setEditAppointment(appointment)
    setShowAppointmentModal(true)
  }

  const handlePrev = () => {
    if (view === 'month' || view === 'agenda') updateDate(prevMonth(currentDate))
    else if (view === 'week') updateDate(prevWeek(currentDate))
    else updateDate(prevDay(currentDate))
  }

  const handleNext = () => {
    if (view === 'month' || view === 'agenda') updateDate(nextMonth(currentDate))
    else if (view === 'week') updateDate(nextWeek(currentDate))
    else updateDate(nextDay(currentDate))
  }

  const getTitle = () => {
    if (view === 'week') return fmtWeekRange(currentDate)
    if (view === 'day') return fmtDayFull(currentDate)
    return fmtMonthYear(currentDate)
  }

  const summaryCards = [
    {
      key: 'all-actions' as const,
      Icon: Layers3,
      value: appointments.length + followUps.length,
      title: t('calendar.summaryCards.allActions.title'),
      hint: t('calendar.summaryCards.allActions.hint', {
        appointments: appointments.length,
        followUps: followUps.length,
      }),
    },
    {
      key: 'today-appointments' as const,
      Icon: CalendarClock,
      value: todayAppointments.length,
      title: t('calendar.summaryCards.todayAppointments.title'),
      hint: t('calendar.summaryCards.todayAppointments.hint', { count: todayAppointments.length }),
    },
    {
      key: 'today-follow-ups' as const,
      Icon: Bell,
      value: todayFollowUps.length,
      title: t('calendar.summaryCards.todayFollowUps.title'),
      hint: t('calendar.summaryCards.todayFollowUps.hint', { count: todayFollowUps.length }),
    },
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b px-4 py-4 md:px-6">
        <div className="rounded-3xl border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_30%)] p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                  {t('calendar.title')}
                </p>
                <p className="mt-2 text-base font-semibold capitalize">{getTitle()}</p>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={handlePrev} className="p-1 rounded-md hover:bg-muted transition-colors shrink-0">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNext} className="p-1 rounded-md hover:bg-muted transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateDate(new Date())}
                  className="text-xs px-2 py-1 rounded-md border hover:bg-muted transition-colors ml-1 shrink-0"
                >
                  {t('calendar.today')}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center border rounded-md overflow-hidden bg-background/60">
                {VIEW_CONFIG.map(({ key, icon: Icon, labelKey, href }, index) => (
                  <button
                    key={key}
                    onClick={() => navigate({ pathname: href, search: searchParams.toString() })}
                    className={cn(
                      'px-2.5 py-1.5 text-xs flex items-center gap-1 transition-colors',
                      index > 0 && 'border-l',
                      view === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t(labelKey)}</span>
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => navigate(`${ROUTES.CALENDAR}/randevular`)}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>{t('calendar.tabs.appointments')}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{t('calendar.tabs.followUps')}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => {
                  setEditFollowUp(null)
                  setShowFollowUpModal(true)
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('calendar.newFollowUp')}</span>
              </Button>

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
                <span>{t('calendar.newAppointment')}</span>
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {summaryCards.map(({ key, Icon, value, hint, title }) => (
              <button
                key={key}
                type="button"
                onClick={() => navigate(`${ROUTES.CALENDAR}/aksiyonlar/${key}`)}
                className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left transition-colors hover:border-primary/25 hover:ring-1 hover:ring-primary/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">{title}</p>
                  </div>
                  <span className="text-lg font-semibold tabular-nums">{value}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'month' && (
          <CalendarMonthView
            currentDate={currentDate}
            appointments={appointments}
            followUps={followUps}
            onDayClick={(date) => updateDate(date, 'day')}
            onAddClick={(date) => {
              setSelectedDate(date)
              setShowAppointmentModal(true)
            }}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {view === 'week' && (
          <CalendarWeekView
            currentDate={currentDate}
            appointments={appointments}
            followUps={followUps}
            onDayClick={(date) => updateDate(date, 'day')}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
        {view === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            appointments={appointments}
            followUps={followUps}
            userId={userId}
            onEditFollowUp={(followUp) => {
              setEditFollowUp(followUp)
              setShowFollowUpModal(true)
            }}
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

      <NewAppointmentModal
        open={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false)
          setEditAppointment(null)
        }}
        userId={userId}
        defaultDate={selectedDate}
        editAppointment={editAppointment}
      />
      <NewFollowUpModal
        open={showFollowUpModal}
        onClose={() => {
          setShowFollowUpModal(false)
          setEditFollowUp(null)
        }}
        userId={userId}
        editFollowUp={editFollowUp}
      />
    </div>
  )
}
