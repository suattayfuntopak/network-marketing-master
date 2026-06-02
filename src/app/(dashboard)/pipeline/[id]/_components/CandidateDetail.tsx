'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Pencil, ChevronDown, Trash2, X, Bot, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, useCandidateDetail, useUpdateCandidate, useDeleteCandidate } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { EditCandidateSheet } from '../../_components/EditCandidateSheet'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { STAGE_COLOR, STAGE_ORDER } from '@/lib/domain/stages'
import { isFollowUpCalendarSuppressed } from '@/lib/domain/calendarFollowUp'
import { deleteWithUndo } from '@/lib/ui/deleteWithUndo'
import { waHref } from '@/lib/utils/waLink'
import type { CandidateStage } from '@/types/database.types'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  resolveCandidateFields,
  mergeCandidateContentUpdate,
} from '@/lib/domain/candidateFields'
import { translateNoteAction } from '../actions'
import {
  suggestedFollowUp,
  daysSince,
  toInputDateTime,
  formatFollowUpDate,
} from './candidateDetailUtils'
import { CandidateProfileCard } from './CandidateProfileCard'
import { LeaderNotesCard } from './LeaderNotesCard'
import { ActivityLogCard } from './ActivityLogCard'
import { PresentationMaterialsCard } from './PresentationMaterialsCard'



interface Props {
  candidateId: string
}

export function CandidateDetail({ candidateId }: Props) {
  const { lang, t } = useTranslation()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState(false)
  const [tempFollowUp, setTempFollowUp] = useState<string>('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [translatedNote, setTranslatedNote] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)

  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { data: c, isLoading: cLoading } = useCandidateDetail(ws?.workspaceId, candidateId)
  const update = useUpdateCandidate(ws?.workspaceId ?? '')
  const del = useDeleteCandidate(ws?.workspaceId ?? '')

  const parsed = c
    ? resolveCandidateFields(c)
    : { noteTr: '', noteEn: '', avatarUrl: null as string | null, warmth: 'ilik' as const }

  const attemptedUpdates = useRef<Record<string, boolean>>({})

  useBodyScrollLock(stageOpen || confirmOpen || editingFollowUp)

  // Not çevirisi: EN modunda kalıcı ve cache'li AI çevirisi
  useEffect(() => {
    if (lang !== 'en' || !c) {
      setTranslatedNote(null)
      return
    }

    const parsedLocal = resolveCandidateFields(c)
    if (parsedLocal.noteEn) {
      setTranslatedNote(parsedLocal.noteEn)
      return
    }

    if (!parsedLocal.noteTr) {
      setTranslatedNote(null)
      return
    }

    let h = 0
    const rawText = parsedLocal.noteTr
    for (let i = 0; i < rawText.length; i++) h = (Math.imul(31, h) + rawText.charCodeAt(i)) | 0
    const cacheKey = `nmm_note_en_${candidateId}_${(h >>> 0).toString(36)}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      setTranslatedNote(cached)
      // Veritabanına da kaydet ki diğer cihazlarda veya localstorage temizlendiğinde çalışsın
      if (!attemptedUpdates.current[candidateId]) {
        attemptedUpdates.current[candidateId] = true
        update.mutate({
          id: c.id,
          ...mergeCandidateContentUpdate(c, { noteEn: cached }),
        })
      }
      return
    }

    if (isTranslating || attemptedUpdates.current[candidateId]) {
      return
    }

    setIsTranslating(true)
    translateNoteAction(parsedLocal.noteTr)
      .then((translated: string) => {
        setTranslatedNote(translated)
        localStorage.setItem(cacheKey, translated)
        // Veritabanına kalıcı olarak kaydet
        if (!attemptedUpdates.current[candidateId]) {
          attemptedUpdates.current[candidateId] = true
          update.mutate({
            id: c.id,
            ...mergeCandidateContentUpdate(c, { noteEn: translated }),
          })
        }
      })
      .catch(() => setTranslatedNote(parsedLocal.noteTr))
      .finally(() => setIsTranslating(false))
  }, [lang, c, candidateId, update, isTranslating])

  const senderName = ws?.fullName || t('pipelinePage.yourAdvisor')

  // Tüm hook'lar erken return'lerden ÖNCE çağrılmalı (rules-of-hooks).
  const handleConfirmCancel = useCallback(() => setConfirmOpen(false), [])

  if (wsLoading || cLoading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <div className="space-y-4">
          <div className="h-8 w-20 animate-pulse rounded bg-[var(--bg-subtle)]" />
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        </div>
      </main>
    )
  }

  if (!c) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">{t('pipeline.candidateNotFound')}</p>
          <button
            onClick={() => router.push('/pipeline')}
            className="mt-4 rounded-xl bg-[#534AB7] px-4 py-2 text-sm font-semibold text-white"
          >
            {t('pipeline.backToPipeline')}
          </button>
        </div>
      </main>
    )
  }

  const waLink = waHref(c.phone)
  const nextFollow = isFollowUpCalendarSuppressed(c)
    ? null
    : c.next_follow_up_at
      ? formatFollowUpDate(c.next_follow_up_at, lang)
      : suggestedFollowUp(c, lang)

  function changeStage(stage: CandidateStage) {
    setStageOpen(false)
    update.mutate({ id: c!.id, stage })
  }

  function saveFollowUpDate(dateStr: string) {
    setEditingFollowUp(false)
    if (!dateStr) {
      update.mutate({ id: c!.id, next_follow_up_at: null })
      return
    }
    update.mutate({ id: c!.id, next_follow_up_at: new Date(dateStr).toISOString() })
  }

  function handleDelete() {
    setConfirmOpen(true)
  }

  function handleDeleteConfirmed() {
    setConfirmOpen(false)
    deleteWithUndo(c!.full_name, () => del.mutate(c!.id))
    router.push('/pipeline')
  }

  return (
    <>
      <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        {/* Geri + Düzenle */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-2)] transition hover:text-[var(--text-1)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('pipeline.back')}
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--bg-subtle)] px-3 py-2 text-sm font-medium text-[var(--text-2)] transition hover:bg-[#EEEDFE] hover:text-[#534AB7]"
          >
            <Pencil className="h-4 w-4" />
            {t('common.edit')}
          </button>
        </div>

        <div className="space-y-4">

          {/* Profil kartı */}
            <CandidateProfileCard
              c={c}
              parsed={parsed}
              translatedNote={translatedNote}
              isTranslating={isTranslating}
            />

            {/* Aksiyon butonları */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => router.push(`/yazar?name=${encodeURIComponent(c.full_name)}&note=${encodeURIComponent(parsed.noteTr)}&warmth=${parsed.warmth}`)}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#EEEDFE] py-4 text-sm font-semibold text-[#534AB7] transition hover:opacity-90 animate-all duration-200 active:scale-95"
              >
                <Bot className="h-4 w-4" strokeWidth={1.75} />
                {t('pipeline.aiMessage')}
              </button>
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-4 text-sm font-semibold text-white transition hover:opacity-90 animate-all duration-200 active:scale-95 text-center"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp
                </a>
              ) : (
                <div className="flex items-center justify-center rounded-2xl bg-[var(--bg-subtle)] py-4 text-xs font-medium text-[var(--text-3)]">
                  {t('pipeline.noWhatsApp')}
                </div>
              )}
              {c.phone ? (
                <a
                  href={`tel:${c.phone}`}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#E8F0FE] py-4 text-sm font-semibold text-[#1A56DB] transition hover:opacity-90 animate-all duration-200 active:scale-95 text-center"
                >
                  <Phone className="h-4 w-4" strokeWidth={1.75} />
                  {t('pipeline.call')}
                </a>
              ) : (
                <div className="flex items-center justify-center rounded-2xl bg-[var(--bg-subtle)] py-4 text-xs font-medium text-[var(--text-3)]">
                  {t('pipeline.noPhone')}
                </div>
              )}
            </div>

            {/* Lider Notu */}
            <LeaderNotesCard
              candidateId={candidateId}
              workspaceId={ws?.workspaceId ?? ''}
              candidateName={c.full_name}
            />

            {/* Aktivite Geçmişi */}
            <ActivityLogCard candidateId={candidateId} workspaceId={ws?.workspaceId ?? ''} />

            {/* Sunum Materyalleri — Aktivite Geçmişi'nin altında, varsayılan kapalı */}
            <PresentationMaterialsCard
              c={c}
              workspaceId={ws?.workspaceId}
              isSuperAdmin={ws?.isSuperAdmin}
              senderName={senderName}
            />

            {/* Alt Yerleşim Grubu (Aşama, Takip ve Sil Butonları 3'lü Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Aşama Card */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col justify-between min-h-[110px]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
                  {t('pipeline.stage')}
                </p>
                <button
                  onClick={() => setStageOpen(v => !v)}
                  className={clsx(
                    'mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90',
                    STAGE_COLOR[c.stage]
                  )}
                  title={t('pipeline.stage')}
                >
                  {t(`stages.${c.stage}`)}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Takip Card */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
                    {t('pipeline.nextContact')}
                  </p>
                  <button
                    onClick={() => {
                      setTempFollowUp(toInputDateTime(c.next_follow_up_at))
                      setEditingFollowUp(true)
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--text-3)] transition hover:text-[#534AB7]"
                    title={t('common.edit')}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex-1 flex flex-col justify-end">
                  <div className="flex items-baseline justify-between w-full">
                    <p className="text-sm font-semibold text-[#534AB7] truncate">
                      {nextFollow ?? '—'}
                    </p>
                    <span className="text-[10px] text-[var(--text-3)] shrink-0 ml-1">
                      ({daysSince(c.last_contact_at, t)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Silme Card */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 flex flex-col justify-between min-h-[110px]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
                  {t('pipeline.deleteCandidate')}
                </p>
                <button
                  onClick={handleDelete}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#FBEAF0] bg-[#FBEAF0] py-2.5 text-sm font-semibold text-[#72243E] transition hover:bg-[#f5d4e0]"
                  title={t('pipeline.deleteCandidate')}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('pipeline.deleteCandidate')}
                </button>
              </div>

            </div>

        </div>
      </main>

      {editOpen && ws && (
        <EditCandidateSheet
          candidate={c}
          workspaceId={ws.workspaceId}
          onClose={() => setEditOpen(false)}
        />
      )}

      {confirmOpen && (
        <ConfirmDeleteModal
          onConfirm={handleDeleteConfirmed}
          onCancel={handleConfirmCancel}
        />
      )}

      {/* Gelecek Temas — ortalı popup (native takvim sayfa altında kesilmesin) */}
      {editingFollowUp && (
        <div
          className={`fixed inset-0 ${Z.confirm} flex items-center justify-center bg-black/50 backdrop-blur-sm p-4`}
          onClick={() => setEditingFollowUp(false)}
        >
          <div
            className="w-full max-w-xs space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-[var(--text-1)]">{t('pipeline.nextContact')}</h3>
            <input
              type="datetime-local"
              value={tempFollowUp}
              onChange={e => setTempFollowUp(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[#534AB7]"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => saveFollowUpDate('')}
                className="text-xs font-semibold text-[var(--text-3)] transition hover:text-red-500"
              >
                {lang === 'en' ? 'Clear' : 'Temizle'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingFollowUp(false)}
                  className="flex h-9 items-center justify-center rounded-xl border border-[var(--border)] px-3 text-sm font-bold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
                  title={t('common.cancel')}
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => saveFollowUpDate(tempFollowUp)}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-green-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-green-600"
                >
                  <Check className="h-4 w-4" />
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
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
                      s === c.stage ? 'text-[#534AB7]' : 'text-[var(--text-1)]'
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
