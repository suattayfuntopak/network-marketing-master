'use client'

import { ChevronDown, Pencil, Trash2, X, RotateCcw, Zap, Calendar, Bot, Sparkles, Copy, Lock, Phone } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { useUpdateCandidate, useDeleteCandidate, useMarkContacted } from '@/hooks/useCandidates'
import { useTranslation } from '@/providers/LanguageProvider'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { EditCandidateSheet } from './EditCandidateSheet'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { STAGE_COLOR, STAGE_ORDER, STAGE_CARD_BG } from '@/lib/domain/stages'
import { FOLLOW_UP_CALENDAR_SUPPRESSED_ISO, followUpDueStatus, isFollowUpCalendarSuppressed } from '@/lib/domain/calendarFollowUp'
import { todayCalendarKey } from '@/lib/utils/calendarDates'
import { deleteWithUndo } from '@/lib/ui/deleteWithUndo'
import { waHref } from '@/lib/utils/waLink'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { toast } from 'sonner'
import { generateQuickMessageAction } from '@/app/(dashboard)/bugun/ilgilen/actions'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'

function daysSince(iso: string | null, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (!iso) return t('common.noContact')
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return t('common.today')
  if (d === 1) return t('common.yesterday')
  return t('common.daysAgo', { days: d })
}

interface CandidateCardProps {
  candidate: NmmCandidate
  workspaceId: string
}

export function CandidateCard({ candidate, workspaceId }: CandidateCardProps) {
  const { lang, t } = useTranslation()
  const [stageOpen, setStageOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [quickActionOpen, setQuickActionOpen] = useState(false)
  const update = useUpdateCandidate(workspaceId)
  const del = useDeleteCandidate(workspaceId)
  const markContacted = useMarkContacted(workspaceId)
  const parsed = resolveCandidateFields(candidate)

  const [generating, setGenerating] = useState(false)
  const [activeMessage, setActiveMessage] = useState<string | null>(null)
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()

  async function handleAIMessage() {
    if (!hasAiFieldAccess) {
      openUpgrade('ai_field')
      return
    }
    setGenerating(true)
    try {
      const result = await generateQuickMessageAction({
        name: candidate.full_name,
        stage: candidate.stage,
        note: parsed.noteTr ?? ''
      })
      if (result.error || !result.message) {
        toast.error(result.error ?? 'Mesaj oluşturulamadı.')
        return
      }
      setActiveMessage(result.message)
    } catch (err) {
      console.error(err)
      toast.error('Mesaj oluşturulamadı.')
    } finally {
      setGenerating(false)
    }
  }

  function changeStage(stage: CandidateStage) {
    setStageOpen(false)
    update.mutate({ id: candidate.id, stage })
  }

  function addFollowUpDays(days: number) {
    setQuickActionOpen(false)
    const base = new Date()
    base.setDate(base.getDate() + days)
    update.mutate({ id: candidate.id, next_follow_up_at: base.toISOString() })
  }

  function clearFollowUp() {
    setQuickActionOpen(false)
    update.mutate({
      id: candidate.id,
      next_follow_up_at: FOLLOW_UP_CALENDAR_SUPPRESSED_ISO,
    })
  }

  useBodyScrollLock(stageOpen || quickActionOpen || confirmOpen || !!activeMessage)

  const handleConfirmCancel = useCallback(() => setConfirmOpen(false), [])

  function handleDeleteConfirmed() {
    setConfirmOpen(false)
    deleteWithUndo(candidate.full_name, () => del.mutate(candidate.id))
  }

  const waLink = waHref(candidate.phone)

  return (
    <>
      <li className={clsx(
        'relative rounded-2xl border border-[var(--border)] p-4 shadow-sm transition-colors',
        STAGE_CARD_BG[candidate.stage],
        (quickActionOpen || stageOpen || editOpen || confirmOpen) && Z.cardOverlay
      )}>
        <div className="flex items-center gap-3">
          {/* Avatar + Bilgi → detay sayfasına link */}
          <Link href={`/pipeline/${candidate.id}`} className="flex flex-1 items-center gap-3 min-w-0">
            <PersonAvatar
              name={candidate.full_name}
              imageUrl={parsed.avatarUrl}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-1)]">{candidate.full_name}</p>
                {parsed.warmth === 'sicak' && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 animate-pulse">
                    🔥<span className="hidden sm:inline"> {t('pipelinePage.warmthHot')}</span>
                  </span>
                )}
                {parsed.warmth === 'ilik' && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
                    ☀️<span className="hidden sm:inline"> {t('pipelinePage.warmthWarm')}</span>
                  </span>
                )}
                {parsed.warmth === 'soguk' && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30">
                    ❄️<span className="hidden sm:inline"> {t('pipelinePage.warmthCold')}</span>
                  </span>
                )}
              </div>
              {candidate.phone && (
                <p className="hidden text-xs text-[var(--text-2)] sm:block">{candidate.phone}</p>
              )}
              {(parsed.noteTr || parsed.noteEn) && (
                <p className="mt-1 hidden line-clamp-2 break-words text-xs text-[var(--text-2)] sm:block">
                  {lang === 'en' ? (parsed.noteEn || parsed.noteTr) : parsed.noteTr}
                </p>
              )}
            </div>
          </Link>

          {/* Eylemler: mobil YZ | WA | Ara — masaüstü YZ solda, WA sağda (ara yok) */}
          <div
            className="flex w-[7.25rem] shrink-0 items-center justify-between gap-1.5 sm:w-20"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleAIMessage}
              disabled={generating}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle text-brand transition-all hover:scale-105 hover:bg-brand-subtle hover:shadow-md disabled:opacity-50 cursor-pointer animate-all duration-200 active:scale-95"
              aria-label="AI Mesaj Üret"
              title="AI Mesaj Üret"
            >
              {generating ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              ) : (
                <Bot className="h-4 w-4" strokeWidth={1.75} />
              )}
              {!hasAiFieldAccess && (
                <Lock className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-[var(--text-3)]" strokeWidth={2.5} aria-hidden />
              )}
            </button>
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markContacted.mutate({ id: candidate.id, actionType: 'whatsapp' })}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-whatsapp text-white transition-all hover:scale-105 hover:shadow-md"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            )}
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                onClick={() => markContacted.mutate({ id: candidate.id, actionType: 'call' })}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A56DB] transition-all hover:scale-105 hover:shadow-md sm:hidden"
                aria-label={t('pipeline.call')}
                title={t('pipeline.call')}
              >
                <Phone className="h-4 w-4" strokeWidth={1.75} />
              </a>
            )}
          </div>
        </div>

        {/* Alt satır: aşama + son temas */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStageOpen(v => !v)}
              className={clsx(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80',
                STAGE_COLOR[candidate.stage]
              )}
              title={t('pipeline.changeStage')}
            >
              {t(`stages.${candidate.stage}`)}
              <ChevronDown className="h-3 w-3" />
            </button>

            {/* Quick Actions (Minimalist Lightning Popover) */}
            <div className="relative">
              <button
                onClick={() => setQuickActionOpen(!quickActionOpen)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all active:scale-95 border border-[var(--border)]"
                title={t('pipelinePage.quickActions')}
              >
                <Zap className="h-3 w-3 shrink-0" />
              </button>

              {quickActionOpen && (
                <>
                  <div className={`fixed inset-0 ${Z.cardOverlay} bg-black/40 backdrop-blur-sm`} onClick={() => setQuickActionOpen(false)} />
                  <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${Z.cardPopover} w-[calc(100%-2rem)] max-w-xs rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl animate-in fade-in zoom-in duration-200`}>
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5 mb-3.5">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
                        <p className="text-sm font-bold text-[var(--text-1)]">
                          {t('pipelinePage.quickActionsTitle')}
                        </p>
                      </div>
                      <button
                        onClick={() => setQuickActionOpen(false)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* İlerlet */}
                      {candidate.stage !== 'kayboldu' && candidate.stage !== 'ilgilenmedi' && (
                        <button
                          onClick={() => {
                            setQuickActionOpen(false)
                            setStageOpen(true)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-left text-xs font-semibold text-[var(--text-1)] hover:bg-brand-subtle hover:text-brand hover:border-brand/30 transition"
                        >
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span>{t('pipelinePage.changeStageAction')}</span>
                        </button>
                      )}

                      {/* Takip Ertele */}
                      <div className="pt-1.5">
                        <p className="px-1 pb-2 text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider">
                          {t('pipelinePage.rescheduleContact')}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => addFollowUpDays(1)}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-2 text-xs font-medium text-[var(--text-1)] hover:bg-[#E8F0FE] hover:text-[#1A56DB] hover:border-[#1A56DB]/30 transition"
                          >
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>+1 {t('pipelinePage.day')}</span>
                          </button>
                          <button
                            onClick={() => addFollowUpDays(3)}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-2 text-xs font-medium text-[var(--text-1)] hover:bg-[#E8F0FE] hover:text-[#1A56DB] hover:border-[#1A56DB]/30 transition"
                          >
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>+3 {t('pipelinePage.days')}</span>
                          </button>
                          <button
                            onClick={() => addFollowUpDays(7)}
                            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-2 text-xs font-medium text-[var(--text-1)] hover:bg-[#E8F0FE] hover:text-[#1A56DB] hover:border-[#1A56DB]/30 transition"
                          >
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span>+7 {t('pipelinePage.days')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Takibi Kapat */}
                      {candidate.next_follow_up_at && !isFollowUpCalendarSuppressed(candidate) && (
                        <div className="pt-2.5 border-t border-[var(--border)] mt-2">
                          <button
                            onClick={clearFollowUp}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-center text-xs font-bold text-red-600 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-400 hover:bg-red-100 transition"
                          >
                            <X className="h-4 w-4 shrink-0" />
                            <span>{t('pipelinePage.removeFollowUp')}</span>
                          </button>
                        </div>
                      )}

                      {/* Düzenle & Sil */}
                      <div className="pt-2.5 border-t border-[var(--border)] mt-2 flex gap-2">
                        <button
                          onClick={() => {
                            setQuickActionOpen(false)
                            setEditOpen(true)
                          }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-2.5 py-2 text-center text-xs font-semibold text-[var(--text-1)] hover:bg-brand-subtle hover:text-brand hover:border-brand/30 transition active:scale-95 cursor-pointer"
                          title={t('common.edit')}
                        >
                          <Pencil className="h-3.5 w-3.5 shrink-0" />
                          <span>{t('common.edit')}</span>
                        </button>
                        <button
                          onClick={() => {
                            setQuickActionOpen(false)
                            setConfirmOpen(true)
                          }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-2.5 py-2 text-center text-xs font-semibold text-red-600 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-400 hover:bg-red-100 transition active:scale-95 cursor-pointer"
                          title={t('common.delete')}
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" />
                          <span>{t('common.delete')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(candidate.stage === 'kayboldu' || candidate.stage === 'ilgilenmedi') && (
              <button
                onClick={() => update.mutate({ id: candidate.id, stage: 'iletisim' })}
                disabled={update.isPending}
                className="flex items-center gap-1 rounded-full border border-brand/30 bg-brand-subtle px-2.5 py-1 text-[10px] font-semibold text-brand transition hover:bg-brand hover:text-white disabled:opacity-50"
                title={t('pipeline.reactivateTitle')}
              >
                <RotateCcw className="h-2.5 w-2.5" />
                {t('pipeline.reactivate')}
              </button>
            )}
            {(() => {
              const status = followUpDueStatus(candidate, todayCalendarKey())
              if (status === 'past') {
                return (
                  <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/20 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-900/30">
                    ⚠️ {t('pipelinePage.followUpOverdue')}
                  </span>
                )
              }
              if (status === 'today') {
                return (
                  <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30 animate-pulse">
                    🔔 {t('pipelinePage.followUpTodayBadge')}
                  </span>
                )
              }
              return null
            })()}
            <span className="hidden text-xs text-[var(--text-3)] sm:inline">{daysSince(candidate.last_contact_at, t)}</span>
          </div>
        </div>
      </li>

      {editOpen && (
        <EditCandidateSheet
          candidate={candidate}
          workspaceId={workspaceId}
          onClose={() => setEditOpen(false)}
        />
      )}

      {confirmOpen && (
        <ConfirmDeleteModal
          onConfirm={handleDeleteConfirmed}
          onCancel={handleConfirmCancel}
        />
      )}

      {stageOpen && (
        <>
          <div className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/30 backdrop-blur-sm`} onClick={() => setStageOpen(false)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[320px] ${Z.sheet} rounded-3xl bg-[var(--bg-card)] shadow-2xl overflow-hidden pb-4 border border-[var(--border)] animate-in fade-in zoom-in duration-200`}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-bold text-[var(--text-1)]">{t('pipeline.selectStage')}</p>
              <button onClick={() => setStageOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="overflow-y-auto py-1" style={{ maxHeight: '55vh' }}>
              {STAGE_ORDER.map(s => (
                <li key={s}>
                  <button
                    onClick={() => changeStage(s)}
                    className={clsx(
                      'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition hover:bg-[var(--bg-subtle)]',
                      s === candidate.stage ? 'text-brand' : 'text-[var(--text-1)]'
                    )}
                  >
                    <span className={clsx('inline-block h-2 w-2 shrink-0 rounded-full', STAGE_COLOR[s].split(' ')[0])} />
                    {t(`stages.${s}`)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      {activeMessage && createPortal(
        <div className={`fixed inset-0 ${Z.confirmBackdrop} flex items-center justify-center p-4`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveMessage(null)} />
          
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/20 text-brand">
                  <Sparkles className="h-4.5 w-4.5 fill-current animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-1)]">Yapay Zeka Mesajı</h2>
                  <p className="text-[11px] text-[var(--text-3)] font-medium mt-0.5">{candidate.full_name} için üretildi</p>
                </div>
              </div>
              <button
                onClick={() => setActiveMessage(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors cursor-pointer animate-all duration-200 active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Textarea */}
            <div className="relative mb-5">
              <textarea
                value={activeMessage}
                readOnly
                rows={6}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] leading-relaxed outline-none resize-none"
              />
            </div>

            {/* Actions: ONLY Copy and WhatsApp icons, WITHOUT ANY text */}
            <div className="flex justify-end gap-2.5">
              {/* Copy Button (Only Icon) */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeMessage)
                  toast.success('Mesaj kopyalandı!')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-brand-subtle hover:text-brand active:scale-95 cursor-pointer"
                title="Kopyala"
              >
                <Copy className="h-4 w-4" />
              </button>

              {/* WhatsApp Button (Only Icon) */}
              {candidate.phone && waHref(candidate.phone, activeMessage) && (
                <a
                  href={waHref(candidate.phone, activeMessage)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    markContacted.mutate({ id: candidate.id, actionType: 'whatsapp' })
                    setActiveMessage(null)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp text-white transition hover:opacity-90 active:scale-95 shadow-[0_4px_12px_rgba(37,211,102,0.2)] cursor-pointer"
                  title="WhatsApp ile Gönder"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {UpgradePrompt}
    </>
  )
}
