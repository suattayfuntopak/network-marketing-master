import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { usePipelineStages, useDeals, useCreateDeal, useMoveDeal } from '@/hooks/usePipeline'
import { useAppointments, useFollowUps } from '@/hooks/useCalendar'
import { useContacts } from '@/hooks/useContacts'
import { DEFAULT_FILTERS, DEFAULT_SORT } from '@/lib/contacts/types'
import { slugifyStageLabel } from '@/lib/pipeline/stageLabels'
import { ContactKanbanBoard, type ContactProcessRecord } from '@/components/pipeline/ContactKanbanBoard'
import { ContactTableView } from './ContactTableView'
import { ManageStagesModal } from './modals/ManageStagesModal'

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
  const { data: deals = [], isLoading: dealsLoading } = useDeals(userId, { status: 'open' })
  const { data: contactsResult, isLoading: contactsLoading } = useContacts({
    userId,
    filters: DEFAULT_FILTERS,
    sort: DEFAULT_SORT,
    page: 1,
    pageSize: 1000,
  })
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments(userId)
  const { data: followUps = [], isLoading: followUpsLoading } = useFollowUps(userId, 'pending')
  const createDeal = useCreateDeal(userId)
  const moveDeal = useMoveDeal(userId)

  const contacts = contactsResult?.data ?? []
  const isLoading = stagesLoading || dealsLoading || contactsLoading || appointmentsLoading || followUpsLoading

  const contactCount = contacts.length
  const subtitle = `${contactCount} ${t(contactCount === 1 ? 'pipeline.contactSingular' : 'pipeline.contactPlural')}`

  const processRecords = useMemo<ContactProcessRecord[]>(() => {
    const stageIds = new Set(stages.map((stage) => stage.id))
    const stageIdBySlug = new Map(stages.map((stage) => [stage.slug, stage.id]))
    const openDealByContact = new Map<string, (typeof deals)[number]>()

    for (const deal of deals) {
      if (!openDealByContact.has(deal.contact_id)) {
        openDealByContact.set(deal.contact_id, deal)
      }
    }

    const fallbackStageId = stages[0]?.id ?? ''

    return contacts.map((contact) => {
      const openDeal = openDealByContact.get(contact.id) ?? null
      const matchedFallbackStageId = stageIdBySlug.get(contact.stage)
      const currentStageId =
        openDeal && stageIds.has(openDeal.stage_id)
          ? openDeal.stage_id
          : matchedFallbackStageId || fallbackStageId

      return {
        contact,
        dealId: openDeal?.id ?? null,
        stageId: currentStageId,
      }
    })
  }, [contacts, deals, stages])

  const handleMoveContact = async (contactId: string, targetStageId: string) => {
    const record = processRecords.find((item) => item.contact.id === contactId)
    const targetStage = stages.find((stage) => stage.id === targetStageId)

    if (!record || !targetStage) return

    const nextPosition = processRecords.filter((item) => item.stageId === targetStageId).length

    if (record.dealId) {
      await moveDeal.mutateAsync({
        dealId: record.dealId,
        stageId: targetStageId,
        position: nextPosition,
      })
      return
    }

    await createDeal.mutateAsync({
      user_id: userId,
      contact_id: record.contact.id,
      stage_id: targetStageId,
      title: record.contact.full_name,
      deal_type: 'prospect',
      value: 0,
      probability: targetStage.win_probability ?? 50,
      position_in_stage: nextPosition,
      notes: JSON.stringify({
        autoProcessCard: true,
        sourceStage: record.contact.stage,
        targetStageSlug: slugifyStageLabel(targetStage.name),
      }),
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
        <div className="flex-1 min-h-0 overflow-hidden">
          {view === 'kanban' ? (
            <div className="h-full overflow-x-auto">
              <ContactKanbanBoard
                stages={stages}
                records={processRecords}
                onMove={handleMoveContact}
              />
            </div>
          ) : (
            <ContactTableView
              records={processRecords}
              stages={stages}
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
