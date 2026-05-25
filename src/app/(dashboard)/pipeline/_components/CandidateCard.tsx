'use client'

import { ChevronDown, Pencil, Trash2, X, RotateCcw, Zap, Calendar } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { useUpdateCandidate, useDeleteCandidate } from '@/hooks/useCandidates'
import { useTranslation } from '@/providers/LanguageProvider'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { parseNote } from '@/lib/noteParser'
import { EditCandidateSheet } from './EditCandidateSheet'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { STAGE_LABEL, STAGE_COLOR, STAGE_ORDER, STAGE_CARD_BG } from '@/lib/stages'
import { deleteWithUndo } from '@/lib/deleteWithUndo'
import { waHref } from '@/lib/waLink'
import { Z } from '@/lib/zIndex'

function daysSince(iso: string | null, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (!iso) return t('common.noContact')
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return t('common.today')
  if (d === 1) return t('common.yesterday')
  return t('common.daysAgo', { days: d })
}

function getFollowUpStatus(iso: string | null): 'past' | 'today' | 'future' | null {
  if (!iso) return null
  const followDate = new Date(iso)
  if (isNaN(followDate.getTime())) return null
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const followDateZero = new Date(followDate)
  followDateZero.setHours(0, 0, 0, 0)
  
  if (followDateZero.getTime() < today.getTime()) {
    return 'past'
  } else if (followDateZero.getTime() === today.getTime()) {
    return 'today'
  }
  return 'future'
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
  const parsed = parseNote(candidate.note)
  const profilePhoto = parsed.avatarUrl || null

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
    update.mutate({ id: candidate.id, next_follow_up_at: null })
  }

  function advanceStage() {
    setQuickActionOpen(false)
    const currentIndex = STAGE_ORDER.indexOf(candidate.stage)
    if (currentIndex !== -1 && currentIndex < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIndex + 1]
      changeStage(nextStage)
    }
  }

  const handleConfirmCancel = useCallback(() => setConfirmOpen(false), [])

  function handleDeleteConfirmed() {
    setConfirmOpen(false)
    deleteWithUndo(candidate.full_name, () => del.mutate(candidate.id))
  }

  const waLink = waHref(candidate.phone)

  return (
    <>
      <li className={clsx('relative rounded-2xl border border-[var(--border)] p-4 shadow-sm transition-colors', STAGE_CARD_BG[candidate.stage])}>
        <div className="flex items-start gap-3">
          {/* Avatar + Bilgi → detay sayfasına link */}
          <Link href={`/pipeline/${candidate.id}`} className="flex flex-1 items-start gap-3 min-w-0">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={candidate.full_name}
                className="h-10 w-10 shrink-0 rounded-full object-cover border border-[#EEEDFE]"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-bold text-[#534AB7]">
                {candidate.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-1)]">{candidate.full_name}</p>
                {parsed.warmth === 'sicak' && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 animate-pulse">🔥 {lang === 'en' ? 'Hot' : 'Sıcak'}</span>
                )}
                {parsed.warmth === 'ilik' && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">☀️ {lang === 'en' ? 'Warm' : 'Ilık'}</span>
                )}
                {parsed.warmth === 'soguk' && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30">❄️ {lang === 'en' ? 'Cold' : 'Soğuk'}</span>
                )}
              </div>
              {candidate.phone && (
                <p className="text-xs text-[var(--text-2)]">{candidate.phone}</p>
              )}
              {candidate.note && (
                <p className="mt-1 line-clamp-2 break-words text-xs text-[var(--text-2)]">
                  {lang === 'en' ? (parsed.en || parsed.tr) : parsed.tr}
                </p>
              )}
            </div>
          </Link>

          {/* Eylemler: Düzenle | Sil | WhatsApp */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={() => setEditOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] transition-all hover:scale-105 hover:bg-[#EEEDFE] hover:text-[#534AB7] hover:shadow-md"
              aria-label="Düzenle"
              title={t('common.edit')}>
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setConfirmOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-2)] transition-all hover:scale-105 hover:bg-[#FBEAF0] hover:text-[#72243E] hover:shadow-md"
              aria-label="Sil"
              title={t('common.delete')}>
              <Trash2 className="h-4 w-4" />
            </button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white transition-all hover:scale-105 hover:shadow-md"
                aria-label="WhatsApp"
                title="WhatsApp">
                <WhatsAppIcon className="h-4 w-4" />
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
                title={lang === 'en' ? 'Quick Actions' : 'Hızlı Aksiyonlar'}
              >
                <Zap className="h-3 w-3 shrink-0" />
              </button>

              {quickActionOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setQuickActionOpen(false)} />
                  <div className="absolute left-0 mt-2 z-50 w-44 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="px-2 py-1 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider">
                      {lang === 'en' ? 'Quick Actions' : 'Hızlı Eylemler'}
                    </p>
                    <div className="mt-1 space-y-1">
                      {/* İlerlet */}
                      {candidate.stage !== 'kayboldu' && candidate.stage !== 'ilgilenmedi' && (
                        <button
                          onClick={advanceStage}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[#534AB7] transition"
                        >
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          <span>{lang === 'en' ? 'Advance Stage ➔' : 'Aşama İlerlet ➔'}</span>
                        </button>
                      )}

                      {/* Takip Ertele */}
                      <p className="px-2 pt-1.5 pb-0.5 text-[9px] font-semibold text-[var(--text-3)] uppercase border-t border-[var(--border)]">
                        {lang === 'en' ? 'Reschedule Contact' : 'Teması Planla'}
                      </p>
                      <button
                        onClick={() => addFollowUpDays(1)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
                      >
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>+1 {lang === 'en' ? 'Day' : 'Gün'}</span>
                      </button>
                      <button
                        onClick={() => addFollowUpDays(3)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
                      >
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>+3 {lang === 'en' ? 'Days' : 'Gün'}</span>
                      </button>
                      <button
                        onClick={() => addFollowUpDays(7)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-[var(--text-2)] hover:bg-[var(--bg-subtle)] transition"
                      >
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>+7 {lang === 'en' ? 'Days' : 'Gün'}</span>
                      </button>

                      {/* Takibi Kapat */}
                      {candidate.next_follow_up_at && (
                        <button
                          onClick={clearFollowUp}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition border-t border-[var(--border)]"
                        >
                          <X className="h-3.5 w-3.5 shrink-0" />
                          <span>{lang === 'en' ? 'Remove Follow-up' : 'Takibi İptal Et'}</span>
                        </button>
                      )}
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
                className="flex items-center gap-1 rounded-full border border-[#534AB7]/30 bg-[#EEEDFE] px-2.5 py-1 text-[10px] font-semibold text-[#534AB7] transition hover:bg-[#534AB7] hover:text-white disabled:opacity-50"
                title={t('pipeline.reactivateTitle')}
              >
                <RotateCcw className="h-2.5 w-2.5" />
                {t('pipeline.reactivate')}
              </button>
            )}
            {(() => {
              const status = getFollowUpStatus(candidate.next_follow_up_at)
              if (status === 'past') {
                return (
                  <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/20 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-900/30">
                    ⚠️ {lang === 'en' ? 'Follow-up Overdue' : 'Takip Gecikti'}
                  </span>
                )
              }
              if (status === 'today') {
                return (
                  <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30 animate-pulse">
                    🔔 {lang === 'en' ? 'Follow-up Today' : 'Bugün Takip'}
                  </span>
                )
              }
              return null
            })()}
            <span className="text-xs text-[var(--text-3)]">{daysSince(candidate.last_contact_at, t)}</span>
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
          <div className={`fixed bottom-0 left-0 right-0 ${Z.sheet} rounded-t-3xl bg-[var(--bg-card)] pb-8 shadow-2xl md:left-1/2 md:top-1/2 md:bottom-auto md:w-72 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:pb-0`}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-bold text-[var(--text-1)]">{t('pipeline.selectStage')}</p>
              <button onClick={() => setStageOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="overflow-y-auto py-1" style={{ maxHeight: '60vh' }}>
              {STAGE_ORDER.map(s => (
                <li key={s}>
                  <button
                    onClick={() => changeStage(s)}
                    className={clsx(
                      'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition hover:bg-[var(--bg-subtle)]',
                      s === candidate.stage ? 'text-[#534AB7]' : 'text-[var(--text-1)]'
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
    </>
  )
}
