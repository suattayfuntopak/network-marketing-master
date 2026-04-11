import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock3, Flame, LayoutGrid, List, Sparkles, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStages } from '@/hooks/usePipeline'
import { useAppointments, useFollowUps } from '@/hooks/useCalendar'
import { useContacts } from '@/hooks/useContacts'
import { DEFAULT_FILTERS, DEFAULT_SORT } from '@/lib/contacts/types'
import { getSyncedPipelineStages, type ContactStageKey } from '@/lib/pipeline/stageLabels'
import { buildPipelineSignalSummary } from '@/lib/pipeline/pipelineSignals'
import { ContactKanbanBoard, type ContactProcessRecord } from '@/components/pipeline/ContactKanbanBoard'
import { ContactTableView } from './ContactTableView'
import { ManageStagesModal } from './modals/ManageStagesModal'
import { useUpdateContactStageById } from '@/hooks/useContact'

type ViewMode = 'kanban' | 'table'

export function PipelinePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const rawView = searchParams.get('view')
  const view: ViewMode = rawView === 'table' ? 'table' : 'kanban'
  const setView = (nextView: ViewMode) => {
    const params = new URLSearchParams(searchParams)
    params.set('view', nextView)
    setSearchParams(params)
  }

  const [showManageStages, setShowManageStages] = useState(false)

  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages(userId)
  const { data: contactsResult, isLoading: contactsLoading } = useContacts({
    userId,
    filters: DEFAULT_FILTERS,
    sort: DEFAULT_SORT,
    page: 1,
    pageSize: 1000,
  })
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments(userId)
  const { data: followUps = [], isLoading: followUpsLoading } = useFollowUps(userId, 'pending')
  const updateContactStage = useUpdateContactStageById(userId)

  const contacts = contactsResult?.data ?? []
  const isLoading = stagesLoading || contactsLoading || appointmentsLoading || followUpsLoading
  const pipelineSignals = useMemo(() => buildPipelineSignalSummary(contacts), [contacts])
  const SIGNAL_TONE_CLASSES = {
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-100',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
  } as const

  const contactCount = contacts.length
  const subtitle = `${contactCount} ${t(contactCount === 1 ? 'pipeline.contactSingular' : 'pipeline.contactPlural')}`
  const syncedStages = useMemo(() => getSyncedPipelineStages(stages), [stages])

  const processRecords = useMemo<ContactProcessRecord[]>(() => {
    const allowedStageKeys = new Set(syncedStages.map((stage) => stage.contactStageKey))
    const fallbackStageKey = syncedStages[0]?.contactStageKey ?? 'new'

    return contacts.map((contact) => {
      return {
        contact,
        stageKey: allowedStageKeys.has(contact.stage as ContactStageKey)
          ? (contact.stage as ContactStageKey)
          : fallbackStageKey,
      }
    })
  }, [contacts, syncedStages])

  const handleMoveContact = async (contactId: string, targetStageKey: ContactStageKey) => {
    const record = processRecords.find((item) => item.contact.id === contactId)
    if (!record || record.contact.stage === targetStageKey) return

    await updateContactStage.mutateAsync({
      contactId,
      newStage: targetStageKey,
      oldStage: record.contact.stage,
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4 p-6 pb-20 lg:pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('pipeline.title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border rounded-md overflow-hidden">
            {([
              { key: 'kanban', icon: LayoutGrid },
              { key: 'table', icon: List },
            ] as const).map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  'px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors',
                  view === key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(`pipeline.views.${key}`)}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowManageStages(true)}
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('pipeline.manageStages')}</span>
          </Button>
        </div>
      </div>

      {!isLoading && contactCount > 0 && (
        <div className="rounded-3xl border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_30%)] p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                {t('pipeline.signalBoard.title')}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('pipeline.signalBoard.subtitle')}
              </p>
            </div>
            <span className="rounded-full border border-border/70 bg-card/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {subtitle}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { key: 'risk', Icon: Clock3, value: pipelineSignals.followUpRisk, tone: 'blue' as const },
                { key: 'momentum', Icon: Flame, value: pipelineSignals.advanceWindow, tone: 'amber' as const },
                { key: 'openings', Icon: Sparkles, value: pipelineSignals.freshOpenings, tone: 'emerald' as const },
              ].map(({ key, Icon, value, tone }) => (
                <div key={key} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${SIGNAL_TONE_CLASSES[tone]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{value}</p>
                  </div>
                  <p className="mt-3 text-sm font-medium">{t(`pipeline.signalBoard.cards.${key}.title`)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t('pipeline.signalBoard.nextMoveLabel')}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`pipeline.signalBoard.nextMove.${pipelineSignals.focus}`, {
                  risk: pipelineSignals.followUpRisk,
                  momentum: pipelineSignals.advanceWindow,
                  openings: pipelineSignals.freshOpenings,
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'kanban' ? (
            <div className="h-full overflow-x-auto">
              <ContactKanbanBoard
                stages={syncedStages}
                records={processRecords}
                onMove={handleMoveContact}
              />
            </div>
          ) : (
            <ContactTableView
              records={processRecords}
              stages={syncedStages}
              appointments={appointments}
              followUps={followUps}
            />
          )}
        </div>
      )}

      <ManageStagesModal
        open={showManageStages}
        onClose={() => setShowManageStages(false)}
        userId={userId}
        stages={stages}
      />
    </div>
  )
}
