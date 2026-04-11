import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { addDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useAppointments, useFollowUps, useTodayAppointments } from '@/hooks/useCalendar'
import { NewAppointmentModal } from '@/components/calendar/modals/NewAppointmentModal'
import { NewFollowUpModal } from '@/components/calendar/modals/NewFollowUpModal'
import { fmtDate, fmtTime } from '@/lib/calendar/dateHelpers'
import { ROUTES } from '@/lib/constants'
import type { AppointmentWithContact, FollowUpWithContact } from '@/lib/calendar/types'

type SummaryCardKey = 'all-actions' | 'today-appointments' | 'today-follow-ups'

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

export function CalendarActionListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { summaryKey } = useParams<{ summaryKey: SummaryCardKey }>()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [editAppointment, setEditAppointment] = useState<AppointmentWithContact | null>(null)
  const [editFollowUp, setEditFollowUp] = useState<FollowUpWithContact | null>(null)

  const from = new Date()
  const to = addDays(new Date(), 35)
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

  const rows = useMemo<Record<SummaryCardKey, SummaryRow[]>>(
    () => ({
      'all-actions': [
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
          onClick: () => {
            setEditAppointment(appointment)
            setShowAppointmentModal(true)
          },
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
      'today-appointments': todayAppointments.map((appointment) => ({
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
        onClick: () => {
          setEditAppointment(appointment)
          setShowAppointmentModal(true)
        },
      })),
      'today-follow-ups': todayFollowUps.map((followUp) => ({
        id: `today-followup-${followUp.id}`,
        actionType: 'follow_up' as const,
        contactName: followUp.contact.full_name,
        phone: followUp.contact.phone,
        stage: followUp.contact.stage,
        title: followUp.title,
        datetime: fmtTime(followUp.due_at),
        status: t(`followUps.status.${new Date(followUp.due_at) < new Date() ? 'overdue' : 'pending'}`),
        onClick: () => {
          setEditFollowUp(followUp)
          setShowFollowUpModal(true)
        },
      })),
    }),
    [appointments, followUps, t, todayAppointments, todayFollowUps]
  )

  const activeKey: SummaryCardKey =
    summaryKey === 'today-appointments' || summaryKey === 'today-follow-ups' || summaryKey === 'all-actions'
      ? summaryKey
      : 'all-actions'

  const titleKeyMap: Record<SummaryCardKey, string> = {
    'all-actions': 'calendar.summaryCards.allActions.title',
    'today-appointments': 'calendar.summaryCards.todayAppointments.title',
    'today-follow-ups': 'calendar.summaryCards.todayFollowUps.title',
  }

  const emptyKeyMap: Record<SummaryCardKey, string> = {
    'all-actions': 'calendar.summaryTable.empty.allActions',
    'today-appointments': 'calendar.summaryTable.empty.todayAppointments',
    'today-follow-ups': 'calendar.summaryTable.empty.todayFollowUps',
  }

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(ROUTES.CALENDAR)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
              {t('calendar.summaryTable.label')}
            </p>
            <h1 className="mt-2 text-2xl font-bold">{t(titleKeyMap[activeKey])}</h1>
          </div>
        </div>
        <span className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-sm font-medium text-muted-foreground">
          {rows[activeKey].length}
        </span>
      </div>

      {rows[activeKey].length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card/55">
          <div className="min-w-[860px]">
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
              {rows[activeKey].map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={row.onClick}
                  className="grid w-full grid-cols-[120px_1.3fr_140px_140px_1.3fr_140px_120px] gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/20"
                >
                  <span className="font-medium">{t(`calendar.summaryTable.types.${row.actionType}`)}</span>
                  <span className="truncate">{row.contactName}</span>
                  <span className="truncate text-muted-foreground">{row.phone ?? '—'}</span>
                  <span className="truncate text-muted-foreground">{row.stage ? t(`pipelineStages.${row.stage}`) : '—'}</span>
                  <span className="truncate">{row.title}</span>
                  <span className="truncate text-muted-foreground">{row.datetime}</span>
                  <span className="truncate text-muted-foreground">{row.status}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-5 py-10 text-sm text-muted-foreground">
          {t(emptyKeyMap[activeKey])}
        </div>
      )}

      <NewAppointmentModal
        open={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false)
          setEditAppointment(null)
        }}
        userId={userId}
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
