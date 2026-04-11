import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus } from 'lucide-react'
import { addDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useAppointments } from '@/hooks/useCalendar'
import { fmtDate, fmtTime } from '@/lib/calendar/dateHelpers'
import { NewAppointmentModal } from '@/components/calendar/modals/NewAppointmentModal'
import { ROUTES } from '@/lib/constants'
import type { AppointmentWithContact } from '@/lib/calendar/types'

export function CalendarAppointmentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [editAppointment, setEditAppointment] = useState<AppointmentWithContact | null>(null)

  const { data: appointments = [] } = useAppointments(userId, addDays(new Date(), -30), addDays(new Date(), 90))

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(ROUTES.CALENDAR)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
              {t('calendar.title')}
            </p>
            <h1 className="mt-2 text-2xl font-bold">{t('calendar.tabs.appointments')}</h1>
          </div>
        </div>

        <Button
          onClick={() => {
            setEditAppointment(null)
            setShowAppointmentModal(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('calendar.newAppointment')}
        </Button>
      </div>

      {appointments.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card/55">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[1.4fr_140px_180px_160px_120px] gap-3 border-b bg-muted/25 px-4 py-3 text-xs font-semibold text-muted-foreground">
              <span>{t('calendar.summaryTable.columns.person')}</span>
              <span>{t('calendar.summaryTable.columns.phone')}</span>
              <span>{t('calendar.summaryTable.columns.title')}</span>
              <span>{t('calendar.summaryTable.columns.datetime')}</span>
              <span>{t('calendar.summaryTable.columns.status')}</span>
            </div>
            <div className="divide-y">
              {appointments.map((appointment) => (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => {
                    setEditAppointment(appointment)
                    setShowAppointmentModal(true)
                  }}
                  className="grid w-full grid-cols-[1.4fr_140px_180px_160px_120px] gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/20"
                >
                  <span className="truncate">{appointment.contact?.full_name ?? t('calendar.summaryTable.noContact')}</span>
                  <span className="truncate text-muted-foreground">{appointment.contact?.phone ?? '—'}</span>
                  <span className="truncate">{appointment.title}</span>
                  <span className="truncate text-muted-foreground">
                    {appointment.all_day
                      ? `${fmtDate(appointment.starts_at, 'd MMM')} · ${t('calendar.appointment.allDay')}`
                      : `${fmtDate(appointment.starts_at, 'd MMM')} · ${fmtTime(appointment.starts_at)} - ${fmtTime(appointment.ends_at)}`}
                  </span>
                  <span className="truncate text-muted-foreground">{t(`calendar.appointment.types.${appointment.type}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-5 py-10 text-sm text-muted-foreground">
          {t('calendar.emptyAppointments')}
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
    </div>
  )
}
