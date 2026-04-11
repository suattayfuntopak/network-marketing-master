import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Send,
  Eye,
  MoreHorizontal,
  ShieldAlert,
  Zap,
  CalendarClock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useFollowUpBuckets } from '@/hooks/useCalendar'
import { FollowUpItem } from '@/components/calendar/FollowUpItem'
import { NewFollowUpModal } from '@/components/calendar/modals/NewFollowUpModal'
import { ROUTES } from '@/lib/constants'
import { getLocale } from '@/lib/calendar/dateHelpers'
import { buildFollowUpInsights } from '@/lib/calendar/followUpInsights'
import type { FollowUpActionType, FollowUpWithContact } from '@/lib/calendar/types'

type BucketKey = 'all' | 'today' | 'tomorrow' | 'thisWeek' | 'overdue' | 'completed'

const ACTION_ICONS: Record<FollowUpActionType, typeof Phone> = {
  call: Phone,
  message: MessageCircle,
  email: Mail,
  visit: MapPin,
  send_info: Send,
  check_in: Eye,
  other: MoreHorizontal,
}

export function FollowUpsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const locale = getLocale()

  const [activeTab, setActiveTab] = useState<BucketKey>('all')
  const [showModal, setShowModal] = useState(false)
  const [editFollowUp, setEditFollowUp] = useState<FollowUpWithContact | null>(null)

  const { data: buckets, isLoading } = useFollowUpBuckets(userId)

  const currentList: FollowUpWithContact[] = buckets?.[activeTab] ?? []
  const pendingCount = useMemo(
    () => (buckets?.all ?? []).filter((item) => item.status !== 'completed').length,
    [buckets]
  )
  const insights = useMemo(() => buildFollowUpInsights(buckets), [buckets])

  const SIGNAL_TONE_CLASSES = {
    good: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
    watch: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
    risk: 'border-rose-500/20 bg-rose-500/10 text-rose-100',
  } as const

  const tabConfig: { key: BucketKey; labelKey: string; danger?: boolean }[] = [
    { key: 'all', labelKey: 'followUps.buckets.all' },
    { key: 'today', labelKey: 'followUps.buckets.today' },
    { key: 'tomorrow', labelKey: 'followUps.buckets.tomorrow' },
    { key: 'thisWeek', labelKey: 'followUps.buckets.thisWeek' },
    { key: 'overdue', labelKey: 'followUps.buckets.overdue', danger: true },
    { key: 'completed', labelKey: 'followUps.buckets.completed' },
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b px-4 py-4 md:px-6">
        <div className="rounded-3xl border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_30%)] p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <button
                onClick={() => navigate(ROUTES.CALENDAR)}
                className="mt-0.5 p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
                  {t('followUps.planner.label')}
                </p>
                <h1 className="mt-2 text-base font-semibold">{t('followUps.pageTitle')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('followUps.summary', { count: pendingCount })}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => {
                setEditFollowUp(null)
                setShowModal(true)
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              {t('followUps.new')}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                key: 'stabilize',
                Icon: ShieldAlert,
                value: insights.overdue,
                tone: insights.tones.stabilize,
              },
              {
                key: 'deliver',
                Icon: Zap,
                value: insights.dueToday,
                tone: insights.tones.deliver,
              },
              {
                key: 'prepare',
                Icon: CalendarClock,
                value: insights.dueTomorrow + insights.upcomingWeek,
                tone: insights.tones.prepare,
              },
            ].map(({ key, Icon, value, tone }) => (
              <div key={key} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${SIGNAL_TONE_CLASSES[tone]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                </div>
                <p className="mt-3 text-sm font-semibold">{t(`followUps.planner.cards.${key}.title`)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-card/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('followUps.planner.nextMoveLabel')}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(`followUps.planner.nextMove.${insights.nextMove}`, {
                coverage: insights.touchCoverage,
                completed: insights.completed,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex border-b shrink-0 overflow-x-auto">
        {tabConfig.map((tab) => {
          const count = buckets?.[tab.key]?.length ?? 0
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t(tab.labelKey)}
              {count > 0 && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full font-medium',
                    tab.danger
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            {activeTab === 'overdue' ? (
              <>
                <AlertCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">{t('followUps.empty.overdue')}</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm mb-1">{t('followUps.empty.default')}</p>
                <p className="text-xs text-muted-foreground/80 mb-3">{t('followUps.empty.hint')}</p>
                {activeTab !== 'completed' && (
                  <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
                    {t('followUps.new')}
                  </Button>
                )}
              </>
            )}
          </div>
        ) : activeTab === 'all' ? (
          <div className="p-4">
            <div className="rounded-xl border overflow-hidden bg-card">
              <div className="hidden lg:grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_minmax(0,1.1fr)_72px_110px] gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                <span>{t('followUps.columns.contact')}</span>
                <span>{t('followUps.columns.stage')}</span>
                <span>{t('followUps.columns.followUp')}</span>
                <span>{t('followUps.columns.dueAt')}</span>
                <span>{t('followUps.columns.notePreview')}</span>
                <span>{t('followUps.columns.channel')}</span>
                <span>{t('followUps.columns.status')}</span>
              </div>

              <div className="divide-y">
                {currentList.map((followUp) => {
                  const ChannelIcon = ACTION_ICONS[followUp.action_type] ?? MoreHorizontal
                  const isCompleted = followUp.status === 'completed'
                  const isOverdue = followUp.status === 'pending' && new Date(followUp.due_at) < new Date()
                  const statusTone = isCompleted
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : isOverdue
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-amber-500/10 text-amber-500'

                  return (
                    <button
                      key={followUp.id}
                      type="button"
                      onClick={() => {
                        setEditFollowUp(followUp)
                        setShowModal(true)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_minmax(0,1.1fr)_72px_110px] lg:items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{followUp.contact.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{followUp.title}</p>
                        </div>

                        <div className="hidden lg:block text-sm text-muted-foreground truncate">
                          {t(`pipelineStages.${followUp.contact.stage}`)}
                        </div>

                        <div className="lg:hidden flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-full bg-muted">
                            {t(`pipelineStages.${followUp.contact.stage}`)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-muted">
                            {t(`followUps.actionTypes.${followUp.action_type}`)}
                          </span>
                        </div>

                        <div className="hidden lg:block text-sm text-muted-foreground truncate">
                          {t(`followUps.actionTypes.${followUp.action_type}`)}
                        </div>

                        <div className="text-sm">
                          <p>{format(parseISO(followUp.due_at), 'd MMM yyyy', { locale })}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(followUp.due_at), 'HH:mm', { locale })}
                          </p>
                        </div>

                        <div className="text-sm text-muted-foreground min-w-0">
                          <p className="truncate">{followUp.notes || t('followUps.noNotes')}</p>
                        </div>

                        <div className="flex items-center lg:justify-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
                            <ChannelIcon className="w-4 h-4" />
                          </span>
                        </div>

                        <div className="flex lg:justify-end">
                          <span className={cn('inline-flex px-2 py-1 rounded-full text-xs font-medium', statusTone)}>
                            {t(`followUps.status.${isCompleted ? 'completed' : isOverdue ? 'overdue' : 'pending'}`)}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {currentList.map((fu) => (
              <FollowUpItem
                key={fu.id}
                followUp={fu}
                userId={userId}
                onEdit={(item) => {
                  setEditFollowUp(item)
                  setShowModal(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <NewFollowUpModal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditFollowUp(null)
        }}
        userId={userId}
        editFollowUp={editFollowUp}
      />
    </div>
  )
}
