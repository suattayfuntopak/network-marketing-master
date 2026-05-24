'use client'

import { ChevronDown, Pencil, Trash2, X, RotateCcw } from 'lucide-react'
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

interface CandidateCardProps {
  candidate: NmmCandidate
  workspaceId: string
}

export function CandidateCard({ candidate, workspaceId }: CandidateCardProps) {
  const { lang, t } = useTranslation()
  const [stageOpen, setStageOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const update = useUpdateCandidate(workspaceId)
  const del = useDeleteCandidate(workspaceId)
  const parsed = parseNote(candidate.note)
  const profilePhoto = parsed.avatarUrl || null

  function changeStage(stage: CandidateStage) {
    setStageOpen(false)
    update.mutate({ id: candidate.id, stage })
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
              <p className="truncate text-sm font-semibold text-[var(--text-1)]">{candidate.full_name}</p>
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
          <div>
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
