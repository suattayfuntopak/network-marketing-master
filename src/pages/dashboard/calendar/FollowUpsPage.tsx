import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useFollowUpBuckets } from '@/hooks/useCalendar'
import { FollowUpItem } from '@/components/calendar/FollowUpItem'
import { NewFollowUpModal } from '@/components/calendar/modals/NewFollowUpModal'
import { ROUTES } from '@/lib/constants'
import type { FollowUpWithContact } from '@/lib/calendar/types'

type BucketKey = 'today' | 'tomorrow' | 'thisWeek' | 'overdue' | 'completed'

const BUCKET_ORDER: BucketKey[] = ['today', 'tomorrow', 'thisWeek', 'overdue', 'completed']

export function FollowUpsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const [activeTab, setActiveTab] = useState<BucketKey>('today')
  const [showModal, setShowModal] = useState(false)
  const [editFollowUp, setEditFollowUp] = useState<FollowUpWithContact | null>(null)

  const { data: buckets, isLoading } = useFollowUpBuckets(userId)

  const currentList: FollowUpWithContact[] = buckets?.[activeTab] ?? []

  const tabConfig: { key: BucketKey; labelKey: string; danger?: boolean }[] = [
    { key: 'today',     labelKey: 'followUps.buckets.today' },
    { key: 'tomorrow',  labelKey: 'followUps.buckets.tomorrow' },
    { key: 'thisWeek',  labelKey: 'followUps.buckets.thisWeek' },
    { key: 'overdue',   labelKey: 'followUps.buckets.overdue', danger: true },
    { key: 'completed', labelKey: 'followUps.buckets.completed' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(ROUTES.CALENDAR)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold">{t('followUps.pageTitle')}</h1>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={() => { setEditFollowUp(null); setShowModal(true) }}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('followUps.new')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b shrink-0 overflow-x-auto">
        {tabConfig.map(tab => {
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
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  tab.danger && count > 0
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
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
                <p className="text-muted-foreground text-sm mb-3">{t('followUps.empty.default')}</p>
                {activeTab !== 'completed' && (
                  <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
                    {t('followUps.new')}
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {currentList.map(fu => (
              <FollowUpItem
                key={fu.id}
                followUp={fu}
                userId={userId}
                onEdit={(fu) => { setEditFollowUp(fu); setShowModal(true) }}
              />
            ))}
          </div>
        )}
      </div>

      <NewFollowUpModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditFollowUp(null) }}
        userId={userId}
        editFollowUp={editFollowUp}
      />
    </div>
  )
}
