'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Phone, Pencil, Bot, Lock } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidateDetail, useUpdateCandidate, useDeleteCandidate, useMarkContacted } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { EditCandidateSheet } from '../../_components/EditCandidateSheet'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { isFollowUpCalendarSuppressed } from '@/lib/domain/calendarFollowUp'
import { deleteWithUndo } from '@/lib/ui/deleteWithUndo'
import { waHref } from '@/lib/utils/waLink'
import type { CandidateStage } from '@/types/database.types'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  resolveCandidateFields,
  mergeCandidateContentUpdate,
} from '@/lib/domain/candidateFields'
import { translateNoteAction } from '../actions'
import {
  suggestedFollowUp,
  formatFollowUpDate,
} from './candidateDetailUtils'
import { CandidateProfileCard } from './CandidateProfileCard'
import { NmmInviteSheet } from './NmmInviteSheet'
import { LeaderNotesCard } from './LeaderNotesCard'
import { ActivityLogCard } from './ActivityLogCard'
import { PresentationMaterialsCard } from './PresentationMaterialsCard'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { CandidateStageCard } from './CandidateStageCard'
import { CandidateFollowUpCard } from './CandidateFollowUpCard'
import { CandidateDeleteCard } from './CandidateDeleteCard'



interface Props {
  candidateId: string
}

export function CandidateDetail({ candidateId }: Props) {
  const { lang, t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  // ?nmmInvite=1 → davet composer'ı aç (state/effect yok → ekstra re-render yok).
  const inviteOpen = searchParams.get('nmmInvite') === '1'
  const closeInvite = useCallback(
    () => router.replace(`/pipeline/${candidateId}`, { scroll: false }),
    [router, candidateId]
  )
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [asyncNote, setAsyncNote] = useState<{ key: string; value: string } | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)

  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { data: c, isLoading: cLoading } = useCandidateDetail(ws?.workspaceId, candidateId)
  const update = useUpdateCandidate(ws?.workspaceId ?? '')
  const del = useDeleteCandidate(ws?.workspaceId ?? '')
  const markContacted = useMarkContacted(ws?.workspaceId ?? '')
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()

  const parsed = c
    ? resolveCandidateFields(c)
    : { noteTr: '', noteEn: '', avatarUrl: null as string | null, warmth: 'ilik' as const }

  const attemptedUpdates = useRef<Record<string, boolean>>({})

  useBodyScrollLock(confirmOpen)

  // Anında bilinen EN not — render'da türetilir (localStorage'a/effect'e gerek yok).
  const immediateNoteEn = useMemo(() => {
    if (lang !== 'en' || !c) return { value: null as string | null, noteTr: null as string | null }
    const p = resolveCandidateFields(c)
    if (p.noteEn) return { value: p.noteEn, noteTr: null as string | null }
    if (!p.noteTr) return { value: null as string | null, noteTr: null as string | null }
    return { value: null as string | null, noteTr: p.noteTr } // çeviri gerekiyor
  }, [lang, c])

  // Not çevirisi: yalnız gerektiğinde (cache veya kalıcı AI çevirisi). Tüm setState'ler
  // async fonksiyon içinde olduğundan senkron set-state-in-effect yok.
  useEffect(() => {
    const noteTr = immediateNoteEn.noteTr
    if (!noteTr || !c) return
    let cancelled = false

    let h = 0
    for (let i = 0; i < noteTr.length; i++) h = (Math.imul(31, h) + noteTr.charCodeAt(i)) | 0
    const cacheKey = `nmm_note_en_${candidateId}_${(h >>> 0).toString(36)}`

    const resolve = async () => {
      setIsTranslating(true)
      try {
        const cached = localStorage.getItem(cacheKey)
        const value = cached ?? (await translateNoteAction(noteTr).catch(() => noteTr))
        if (cancelled) return
        setAsyncNote({ key: candidateId, value })
        if (!cached) localStorage.setItem(cacheKey, value)
        // Kalıcı: noteEn'i DB'ye yaz (diğer cihaz / cache temizliğinde de çalışsın).
        if (!attemptedUpdates.current[candidateId]) {
          attemptedUpdates.current[candidateId] = true
          update.mutate({ id: c.id, ...mergeCandidateContentUpdate(c, { noteEn: value }) })
        }
      } finally {
        if (!cancelled) setIsTranslating(false)
      }
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [immediateNoteEn, c, candidateId, update])

  // Gösterilecek çeviri: anında türetilen ya da (aynı adaya ait) async sonuç.
  const translatedNote =
    immediateNoteEn.value ?? (asyncNote?.key === candidateId ? asyncNote.value : null)

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
    update.mutate({ id: c!.id, stage })
  }

  function saveFollowUpDate(isoOrEmpty: string | null) {
    update.mutate({ id: c!.id, next_follow_up_at: isoOrEmpty })
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
                type="button"
                onClick={() => {
                  if (!hasAiFieldAccess) {
                    openUpgrade('ai_field')
                    return
                  }
                  router.push(`/yazar?name=${encodeURIComponent(c.full_name)}&note=${encodeURIComponent(parsed.noteTr)}&warmth=${parsed.warmth}`)
                }}
                className="relative flex items-center justify-center gap-1.5 rounded-2xl bg-[#EEEDFE] py-4 text-sm font-semibold text-[#534AB7] transition hover:opacity-90 animate-all duration-200 active:scale-95"
              >
                <Bot className="h-4 w-4" strokeWidth={1.75} />
                {t('pipeline.aiMessage')}
                {!hasAiFieldAccess && (
                  <Lock className="absolute right-3 top-3 h-3 w-3 text-[var(--text-3)]" strokeWidth={2.5} aria-hidden />
                )}
              </button>
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markContacted.mutate({ id: candidateId, actionType: 'whatsapp' })}
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
                  onClick={() => markContacted.mutate({ id: candidateId, actionType: 'call' })}
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <CandidateStageCard stage={c.stage} onChangeStage={changeStage} />
              <CandidateFollowUpCard
              nextFollowUpAt={c.next_follow_up_at}
              lastContactAt={c.last_contact_at}
              nextFollowLabel={nextFollow}
              onSave={saveFollowUpDate}
            />
              <CandidateDeleteCard onDelete={handleDelete} />
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

      {inviteOpen && c && (
        <NmmInviteSheet
          candidate={{ id: candidateId, full_name: c.full_name, phone: c.phone }}
          onClose={closeInvite}
        />
      )}
      {UpgradePrompt}
    </>
  )
}
