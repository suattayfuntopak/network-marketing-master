import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStages } from '@/hooks/usePipeline'
import { useAppointments, useFollowUps } from '@/hooks/useCalendar'
import { useProcessContacts } from '@/hooks/useContacts'
import { getSyncedPipelineStages, type ContactStageKey } from '@/lib/pipeline/stageLabels'
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
  const { data: contacts = [], isLoading: contactsLoading } = useProcessContacts({
    userId,
    limit: 500,
  })
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments(userId)
  const { data: followUps = [], isLoading: followUpsLoading } = useFollowUps(userId, 'pending')
  const updateContactStage = useUpdateContactStageById(userId)

  const isLoading = stagesLoading || contactsLoading || appointmentsLoading || followUpsLoading

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

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          {view === 'kanban' ? (
            <div className="overflow-x-auto overflow-y-visible pb-4">
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
