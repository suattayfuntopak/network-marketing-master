import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import i18n from '@/i18n'
import { ROUTES } from '@/lib/constants'
import { resolveStageLabel } from '@/lib/pipeline/stageLabels'
import { ChannelButtons } from '@/components/contacts/ChannelButtons'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import type { AppointmentWithContact, FollowUpWithContact } from '@/lib/calendar/types'
import type { ContactProcessRecord } from '@/components/pipeline/ContactKanbanBoard'
import type { SyncedPipelineStage } from '@/lib/pipeline/stageLabels'

interface Props {
  records: ContactProcessRecord[]
  stages: SyncedPipelineStage[]
  appointments: AppointmentWithContact[]
  followUps: FollowUpWithContact[]
}

export function ContactTableView({ records, stages, appointments, followUps }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language?.startsWith('en') ? enUS : tr

  const stageMap = useMemo(
    () => Object.fromEntries(stages.map((stage) => [stage.contactStageKey, stage])),
    [stages]
  )

  const nextAppointmentByContact = useMemo(() => {
    const map = new Map<string, AppointmentWithContact>()

    for (const appointment of appointments) {
      if (!appointment.contact_id || ['cancelled', 'completed'].includes(appointment.status)) continue
      const current = map.get(appointment.contact_id)
      if (!current || appointment.starts_at < current.starts_at) {
        map.set(appointment.contact_id, appointment)
      }
    }

    return map
  }, [appointments])

  const nextFollowUpByContact = useMemo(() => {
    const map = new Map<string, FollowUpWithContact>()

    for (const followUp of followUps) {
      const current = map.get(followUp.contact_id)
      if (!current || followUp.due_at < current.due_at) {
        map.set(followUp.contact_id, followUp)
      }
    }

    return map
  }, [followUps])

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[980px] text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('pipeline.columns.contactPerson')}</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('pipeline.columns.channels')}</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('pipeline.columns.stage')}</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('pipeline.columns.warmth')}</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('pipeline.columns.appointmentDate')}</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('pipeline.columns.followUpDate')}</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('pipeline.columns.lastContact')}</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-muted-foreground">
                {t('contacts.noContacts')}
              </td>
            </tr>
          ) : (
            records.map((record) => {
              const { contact } = record
              const stage = stageMap[record.stageKey]
              const appointment = nextAppointmentByContact.get(contact.id)
              const followUp = nextFollowUpByContact.get(contact.id)
              const initials = contact.full_name
                .split(' ')
                .map((name) => name[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()

              return (
                <tr
                  key={contact.id}
                  className="cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/20"
                  onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                        {initials}
                      </div>
                      <p className="font-medium">{contact.full_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ChannelButtons contact={contact} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{stage ? resolveStageLabel(stage, t) : '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <WarmthScoreBadge score={contact.warmth_score} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {appointment ? format(parseISO(appointment.starts_at), 'd MMM yyyy', { locale }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {followUp ? format(parseISO(followUp.due_at), 'd MMM yyyy', { locale }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.last_contact_at
                      ? format(parseISO(contact.last_contact_at), 'd MMM yyyy', { locale })
                      : '—'}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
