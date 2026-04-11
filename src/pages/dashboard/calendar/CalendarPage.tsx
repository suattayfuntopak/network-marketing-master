import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Bell, CalendarDays, List, CalendarRange, Calendar, Layers3, CalendarClock } from 'lucide-react'
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
  fmtDate, fmtMonthYear, fmtTime, fmtWeekRange, fmtDayFull,
  prevMonth, nextMonth,
  prevWeek, nextWeek,
  prevDay, nextDay,
} from '@/lib/calendar/dateHelpers'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { ROUTES } from '@/lib/constants'
import { buildFollowUpInsights } from '@/lib/calendar/followUpInsights'
import type { AppointmentWithContact, FollowUpWithContact } from '@/lib/calendar/types'

type CalendarView = 'month' | 'week' | 'day' | 'agenda'
type SummaryCardKey = 'totalActions' | 'todayAppointments' | 'todayFollowUps'

interface SummaryRow {
  id: string
  actionType: 'appointment' | 'follow_up'
  contactName: string
  phone: string | null
  stage: string | null
  title: string
  datetime: string
  status: string
  onClick: () => void
}

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
  const { data: todayAppointments = [] } = useTodayAppointments(userId)
  const [activeSummaryCard, setActiveSummaryCard] = useState<SummaryCardKey>('totalActions')
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

  const todayFollowUps = useMemo(
    () =>
      followUps.filter((item) => {
        const date = new Date(item.due_at)
        const now = new Date()
        return date.toDateString() === now.toDateString()
      }),
    [followUps]
  )

  const summaryRows = useMemo<Record<SummaryCardKey, SummaryRow[]>>(
    () => ({
      totalActions: [
        ...appointments.map((appointment) => ({
          id: `appointment-${appointment.id}`,
          actionType: 'appointment' as const,
          contactName: appointment.contact?.full_name ?? t('calendar.summaryTable.noContact'),
          phone: appointment.contact?.phone ?? null,
          stage: null,
          title: appointment.title,
          datetime: appointment.all_day
            ? `${fmtDate(appointment.starts_at, 'd MMM')} · ${t('calendar.appointment.allDay')}`
            : `${fmtDate(appointment.starts_at, 'd MMM')} · ${fmtTime(appointment.starts_at)} - ${fmtTime(appointment.ends_at)}`,
          status: t(`calendar.appointment.types.${appointment.type}`),
          onClick: () => handleAppointmentClick(appointment),
        })),
        ...followUps.map((followUp) => ({
          id: `followup-${followUp.id}`,
          actionType: 'follow_up' as const,
          contactName: followUp.contact.full_name,
          phone: followUp.contact.phone,
          stage: followUp.contact.stage,
          title: followUp.title,
          datetime: `${fmtDate(followUp.due_at, 'd MMM')} · ${fmtTime(followUp.due_at)}`,
          status: t(`followUps.status.${new Date(followUp.due_at) < new Date() ? 'overdue' : 'pending'}`),
          onClick: () => {
            setEditFollowUp(followUp)
            setShowFollowUpModal(true)
          },
        })),
      ],
      todayAppointments: todayAppointments.map((appointment) => ({
        id: `today-appointment-${appointment.id}`,
        actionType: 'appointment' as const,
        contactName: appointment.contact?.full_name ?? t('calendar.summaryTable.noContact'),
        phone: appointment.contact?.phone ?? null,
        stage: null,
        title: appointment.title,
        datetime: appointment.all_day
          ? t('calendar.appointment.allDay')
          : `${fmtTime(appointment.starts_at)} - ${fmtTime(appointment.ends_at)}`,
        status: t(`calendar.appointment.types.${appointment.type}`),
        onClick: () => handleAppointmentClick(appointment),
      })),
      todayFollowUps: todayFollowUps.map((followUp) => ({
        id: `today-followup-${followUp.id}`,
        actionType: 'follow_up' as const,
        contactName: followUp.contact.full_name,
        phone: followUp.contact.phone,
        stage: followUp.contact.stage,
        title: followUp.title,
        datetime: `${fmtTime(followUp.due_at)}`,
        status: t(`followUps.status.${new Date(followUp.due_at) < new Date() ? 'overdue' : 'pending'}`),
        onClick: () => {
          setEditFollowUp(followUp)
          setShowFollowUpModal(true)
        },
      })),
    }),
    [appointments, followUps, t, todayAppointments, todayFollowUps]
  )

  const summaryCards = [
    {
      key: 'totalActions' as const,
      Icon: Layers3,
      value: appointments.length + followUps.length,
      title: t('calendar.summaryCards.totalActions.title'),
      hint: t('calendar.summaryCards.totalActions.hint', {
        appointments: appointments.length,
        followUps: followUps.length,
      }),
    },
    {
      key: 'todayAppointments' as const,
      Icon: CalendarClock,
      value: todayAppointments.length,
      title: t('calendar.summaryCards.todayAppointments.title'),
      hint: t('calendar.summaryCards.todayAppointments.hint', { count: todayAppointments.length }),
    },
    {
      key: 'todayFollowUps' as const,
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
                  onClick={() => setCurrentDate(new Date())}
                  className="text-xs px-2 py-1 rounded-md border hover:bg-muted transition-colors ml-1 shrink-0"
                >
                  {t('calendar.today')}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center border rounded-md overflow-hidden bg-background/60">
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

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => navigate(`${ROUTES.CALENDAR}/takipler`)}
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('followUps.pageTitle')}</span>
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
                <span className="hidden sm:inline">{t('calendar.newAppointment')}</span>
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {summaryCards.map(({ key, Icon, value, hint, title }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSummaryCard(key)}
                className={cn(
                  'rounded-2xl border bg-card/60 px-4 py-3 text-left transition-colors',
                  activeSummaryCard === key
                    ? 'border-primary/40 ring-1 ring-primary/25'
                    : 'border-border/70 hover:border-primary/25'
                )}
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

          <div className="mt-4 rounded-2xl border border-border/70 bg-card/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t('calendar.summaryTable.label')}
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {t(`calendar.summaryCards.${activeSummaryCard}.title`)}
                </p>
              </div>
              <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {summaryRows[activeSummaryCard].length}
              </span>
            </div>

            {summaryRows[activeSummaryCard].length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[760px] overflow-hidden rounded-2xl border border-border/70">
                  <div className="grid grid-cols-[120px_1.3fr_140px_140px_1.3fr_140px_120px] gap-3 border-b bg-muted/25 px-4 py-3 text-xs font-semibold text-muted-foreground">
                    <span>{t('calendar.summaryTable.columns.type')}</span>
                    <span>{t('calendar.summaryTable.columns.person')}</span>
                    <span>{t('calendar.summaryTable.columns.phone')}</span>
                    <span>{t('calendar.summaryTable.columns.stage')}</span>
                    <span>{t('calendar.summaryTable.columns.title')}</span>
                    <span>{t('calendar.summaryTable.columns.datetime')}</span>
                    <span>{t('calendar.summaryTable.columns.status')}</span>
                  </div>
                  <div className="divide-y">
                    {summaryRows[activeSummaryCard].map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={row.onClick}
                        className="grid w-full grid-cols-[120px_1.3fr_140px_140px_1.3fr_140px_120px] gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/20"
                      >
                        <span className="font-medium">
                          {t(`calendar.summaryTable.types.${row.actionType}`)}
                        </span>
                        <span className="truncate">{row.contactName}</span>
                        <span className="truncate text-muted-foreground">{row.phone ?? '—'}</span>
                        <span className="truncate text-muted-foreground">
                          {row.stage ? t(`pipelineStages.${row.stage}`) : '—'}
                        </span>
                        <span className="truncate">{row.title}</span>
                        <span className="truncate text-muted-foreground">{row.datetime}</span>
                        <span className="truncate text-muted-foreground">{row.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                {t(`calendar.summaryTable.empty.${activeSummaryCard}`)}
              </div>
            )}
          </div>
        </div>
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
