'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { List, LayoutList, Phone, Bot, Copy, Check, Sparkles, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, useMarkContacted } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { getStageLabel, STAGE_COLOR } from '@/lib/domain/stages'
import { waHref } from '@/lib/utils/waLink'
import { generateQuickMessageAction } from '../actions'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { FieldWeekSummary } from '@/app/(dashboard)/_components/pulse/FieldWeekSummary'
import { HedefGunlukKpi } from './HedefGunlukKpi'

function formatDaysAgo(days: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  if (!isFinite(days)) return t('pagesUi.neverContacted')
  if (days < 1) return t('pagesUi.today')
  if (days < 2) return t('pagesUi.oneDayAgo')
  return t('pagesUi.daysAgo', { days: Math.floor(days) })
}


export function IlgilenContent() {
  const { lang, t } = useTranslation()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list')
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [copiedFor, setCopiedFor] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [activeMessage, setActiveMessage] = useState<{
    candidateId: string;
    candidateName: string;
    candidatePhone: string | null;
    message: string;
  } | null>(null)

  useBodyScrollLock(!!activeMessage)

  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const { daily, remaining, all } = useDailyActions(candidates)
  const markContacted = useMarkContacted(ws?.workspaceId ?? '')

  async function handleAIMessage(id: string, name: string, stage: string, note: string | null, phone: string | null) {
    setGeneratingFor(id)
    try {
      const result = await generateQuickMessageAction({ name, stage, note })
      if (result.error || !result.message) {
        toast.error(result.error ?? t('pagesUi.couldNotGenerateMessage'))
        return
      }
      setActiveMessage({
        candidateId: id,
        candidateName: name,
        candidatePhone: phone,
        message: result.message
      })
    } catch (err) {
      console.error(err)
      toast.error(t('pagesUi.couldNotGenerateMessage'))
    } finally {
      setGeneratingFor(null)
    }
  }

  if (wsLoading || cLoading) {
    return (
      <div className="space-y-4">
        <FieldWeekSummary />
        <HedefGunlukKpi />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      </div>
    )
  }

  if (daily.length === 0) {
    return (
      <div className="space-y-4">
        <FieldWeekSummary />
        <HedefGunlukKpi />
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-3xl">🎉</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">
            {t('pagesUi.noPendingFollowUps')}
          </p>
          <p className="mt-1 text-xs text-[var(--text-2)]">
            {t('pagesUi.greatJob')}
          </p>
        </div>
      </div>
    )
  }

      const listData = showAll ? all : daily

      return (
        <div className="space-y-4">
          <FieldWeekSummary />
        <HedefGunlukKpi />
          {/* Başlık + görünüm toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-2)]">
              <span className="font-semibold text-[var(--text-1)]">{listData.length}</span> {t('pagesUi.prioritiesLabel')}
              {remaining > 0 && !showAll && (
                <span className="ml-1 text-[var(--text-3)]">+{remaining} {t('pagesUi.moreWaiting')}</span>
              )}
            </p>
            <div className="flex overflow-hidden rounded-xl border border-[var(--border)]">
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'flex h-9 w-9 items-center justify-center transition-colors',
                  viewMode === 'list' ? 'bg-[#534AB7] text-white' : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={clsx(
                  'flex h-9 w-9 items-center justify-center transition-colors',
                  viewMode === 'compact' ? 'bg-[#534AB7] text-white' : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
                )}
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
    
          {viewMode === 'list' ? (
            <ul className="space-y-3">
              {listData.map(c => (
            <li
              key={c.id}
              onClick={() => router.push(`/pipeline/${c.id}`)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm transition-colors hover:border-[#534AB7]/30 active:scale-[0.99]"
            >
              <PersonAvatar
                name={c.full_name}
                imageUrl={resolveCandidateFields(c).avatarUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-1)]">{c.full_name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STAGE_COLOR[c.stage])}>
                    {getStageLabel(c.stage, lang)}
                  </span>
                  <span className="text-xs text-[var(--text-3)]">{formatDaysAgo(c.daysSinceContact, t)}</span>
                </div>
              </div>
              {/* Eylem butonları — tıklama propagasyonu engelle */}
              <div className="flex shrink-0 gap-1.5" onClick={e => e.stopPropagation()}>
                {/* Inline AI Mesaj */}
                <button
                  onClick={() => handleAIMessage(c.id, c.full_name, c.stage, c.note ?? null, c.phone ?? null)}
                  disabled={generatingFor === c.id}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFE] text-[#534AB7] transition hover:opacity-80 disabled:opacity-50"
                  aria-label={t('pagesUi.generateAiMessage')}
                  title={t('pagesUi.generateAndCopyAiMessage')}
                >
                  {generatingFor === c.id ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
                  ) : copiedFor === c.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
                {waHref(c.phone) && (
                  <a
                    href={waHref(c.phone)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markContacted.mutate({ id: c.id, actionType: 'whatsapp' })}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                  </a>
                )}
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    onClick={() => markContacted.mutate({ id: c.id, actionType: 'call' })}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFE] text-[#534AB7]"
                    aria-label={t('pagesUi.call')}
                  >
                    <Phone className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
            {listData.map((c, i) => (
              <div
                key={c.id}
                onClick={() => router.push(`/pipeline/${c.id}`)}
                className={clsx(
                  'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-subtle)] active:scale-[0.99]',
                  i > 0 && 'border-t border-[var(--border)]'
                )}
              >
                <PersonAvatar
                  name={c.full_name}
                  imageUrl={resolveCandidateFields(c).avatarUrl}
                  size="sm"
                />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
                <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', STAGE_COLOR[c.stage])}>
                  {getStageLabel(c.stage, lang)}
                </span>
                <span className="shrink-0 text-xs text-[var(--text-3)]">{formatDaysAgo(c.daysSinceContact, t)}</span>
              </div>
            ))}
          </div>
        )}

        {remaining > 0 && (
          <p className="rounded-2xl border border-dashed border-[var(--border)] py-3 text-center text-xs text-[var(--text-3)]">
            {showAll ? (
              <>
                {t('today.allPriorityListed')}{' '}
                <button
                  onClick={() => setShowAll(false)}
                  className="font-bold text-[#72243E] hover:underline ml-1"
                >
                  {t('today.collapse')}
                </button>
              </>
            ) : (
              <>
                {t('today.moreLeadsPending', { remaining, count: daily.length })}{' '}
                <button
                  onClick={() => setShowAll(true)}
                  className="font-bold text-[#534AB7] hover:underline ml-1"
                >
                  {t('today.showAll')}
                </button>
              </>
            )}
          </p>
        )}
      {/* AI Message Result Modal */}
      {activeMessage && createPortal(
        <div className={`fixed inset-0 ${Z.confirmBackdrop} flex items-center justify-center p-4`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveMessage(null)} />
          
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/20 text-[#534AB7]">
                  <Sparkles className="h-4.5 w-4.5 fill-current animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-1)]">
                    {t('pagesUi.aiMessage')}
                  </h2>
                  <p className="text-[11px] text-[var(--text-3)] font-medium mt-0.5">
                    {t('pagesUi.generatedFor', { name: activeMessage.candidateName })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveMessage(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Textarea */}
            <div className="relative mb-5">
              <textarea
                value={activeMessage.message}
                readOnly
                rows={6}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] leading-relaxed outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5">
              {/* Copy Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeMessage.message)
                  toast.success(t('pagesUi.messageCopied'))
                }}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[#EEEDFE] hover:text-[#534AB7] active:scale-95 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                {t('pagesUi.copy')}
              </button>

              {/* WhatsApp Button */}
              {activeMessage.candidatePhone && waHref(activeMessage.candidatePhone) && (
                <a
                  href={waHref(activeMessage.candidatePhone, activeMessage.message)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (ws?.workspaceId && activeMessage.candidateId) {
                       markContacted.mutate({ id: activeMessage.candidateId, actionType: 'whatsapp' })
                    }
                    setActiveMessage(null)
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 shadow-[0_4px_12px_rgba(37,211,102,0.2)] cursor-pointer"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {t('pagesUi.sendViaWhatsApp')}
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
