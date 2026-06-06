'use client'

import { useEffect, useRef, useState } from 'react'
import { History, PhoneCall, Bot, Pencil, ArrowRight, Trash2 } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTranslation } from '@/providers/LanguageProvider'
import { useActivityHistory, useDeleteActivity } from '@/hooks/useCandidates'
import { deleteWithUndo } from '@/lib/ui/deleteWithUndo'
import { renderActivityText } from './candidateDetailUtils'

interface Props {
  candidateId: string
  workspaceId: string
}

function ActivityLogCardBody({ candidateId, workspaceId }: Props) {
  const { lang, t } = useTranslation()
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'

  const { data: activityLog = [] } = useActivityHistory(candidateId, true)
  const deleteActivityMutation = useDeleteActivity(workspaceId)

  const [showAllActivity, setShowAllActivity] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activityToDelete, setActivityToDelete] = useState<any | null>(null)

  function handleActivityDeleteConfirmed() {
    if (!activityToDelete) return
    const id = activityToDelete.id
    const typeLabel = t('pipelinePage.activityLog')
    setActivityToDelete(null)
    deleteWithUndo(typeLabel, () =>
      deleteActivityMutation.mutate({ activityId: id, candidateId })
    )
  }

  if (activityLog.length === 0) return null

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
          <History className="h-3.5 w-3.5" />
          {t('pipeline.activityHistory')}
        </p>
        <ul className="space-y-2">
          {(showAllActivity ? activityLog : activityLog.slice(0, 5)).map(a => (
            <li key={a.id} className="group flex items-start gap-2.5 text-sm py-0.5 animate-in fade-in duration-200">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] mt-0.5">
                {a.action_type === 'call'         && <PhoneCall className="h-3.5 w-3.5 text-[#534AB7]" />}
                {a.action_type === 'whatsapp'     && <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />}
                {a.action_type === 'ai_generate'   && <Bot className="h-3.5 w-3.5 text-[#534AB7]" />}
                {a.action_type === 'note'         && <Pencil className="h-3.5 w-3.5 text-[var(--text-3)]" />}
                {a.action_type === 'stage_change' && <ArrowRight className="h-3.5 w-3.5 text-[#854F0B]" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-relaxed text-[var(--text-2)] break-words">
                  {renderActivityText(a, lang, t)}
                </p>
                <p className="text-[9px] text-[var(--text-3)] font-medium mt-0.5">
                  {new Date(a.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => setActivityToDelete(a)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 dark:hover:bg-red-950/20 active:scale-95 mt-1"
                title={t('pipelinePage.deleteActivity')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        {activityLog.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllActivity(!showAllActivity)}
            className="w-full text-center text-xs font-bold text-[#534AB7] hover:underline pt-2 border-t border-[var(--border)] transition active:scale-95"
          >
            {showAllActivity
              ? t('pipelinePage.showLess')
              : t('pipelinePage.showAll')}
          </button>
        )}
      </div>

      {activityToDelete && (
        <ConfirmDeleteModal
          message={t('pipelinePage.confirmDeleteActivity')}
          onConfirm={handleActivityDeleteConfirmed}
          onCancel={() => setActivityToDelete(null)}
        />
      )}
    </>
  )
}

/** Viewport'a girince fetch — aday detay ilk yükünü hafifletir. */
export function ActivityLogCard({ candidateId, workspaceId }: Props) {
  const { t } = useTranslation()
  const anchorRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const el = anchorRef.current
    if (!el || shouldLoad) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '240px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div ref={anchorRef} className="min-h-[1px]">
      {shouldLoad ? (
        <ActivityLogCardBody candidateId={candidateId} workspaceId={workspaceId} />
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
            <History className="h-3.5 w-3.5" />
            {t('pipeline.activityHistory')}
          </p>
          <Skeleton className="mt-3 h-16 w-full rounded-xl" />
        </div>
      )}
    </div>
  )
}
