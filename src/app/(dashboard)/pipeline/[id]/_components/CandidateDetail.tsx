'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Phone, Pencil, ChevronDown, ChevronUp, Trash2, X, Bot, History, PhoneCall, MessageSquare, Presentation, Check, StickyNote } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, useUpdateCandidate, useDeleteCandidate, useActivityHistory, useCandidateNotes, useAddCandidateNote, useDeleteActivity, useLogPresentationWhatsApp } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { EditCandidateSheet } from '../../_components/EditCandidateSheet'
import { toast } from 'sonner'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { STAGE_LABEL, STAGE_COLOR, STAGE_ORDER, FOLLOW_DAYS } from '@/lib/domain/stages'
import { isFollowUpCalendarSuppressed } from '@/lib/domain/calendarFollowUp'
import { deleteWithUndo } from '@/lib/ui/deleteWithUndo'
import { waHref } from '@/lib/utils/waLink'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { Z } from '@/lib/ui/zIndex'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  resolveDailyActionNote,
  mergeDailyActionNoteUpdate,
  displayDailyActionNote,
  parseBilingualText,
  isLeaderUserNote,
  getWhatsAppActivityDisplay,
} from '@/lib/domain/dailyActionNote'
import {
  resolveCandidateFields,
  mergeCandidateContentUpdate,
} from '@/lib/domain/candidateFields'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { generateNotesSummary, translateNoteAction } from '../actions'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePresentationMaterials, pickDefaultMaterial } from '@/hooks/usePresentationMaterials'
import { renderPresentationMessage } from '@/lib/domain/presentationMaterials'



function suggestedFollowUp(c: NmmCandidate, lang: string): string | null {
  const days = FOLLOW_DAYS[c.stage]
  if (!days) return null
  const base = new Date(c.last_contact_at ?? c.created_at)
  base.setDate(base.getDate() + days)
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  return base.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
}

function daysSince(iso: string | null, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (!iso) return t('common.noContact')
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return t('common.today')
  if (d === 1) return t('common.yesterday')
  return t('common.daysAgo', { days: d })
}

function toInputDateTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  const YYYY = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const DD = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`
}

function formatFollowUpDate(iso: string | null, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderActivityText(a: any, lang: string, t: any): string {
  const warmthMap: Record<string, {tr: string, en: string}> = {
    sicak: { tr: 'Sıcak 🔥', en: 'Hot 🔥' },
    ilik: { tr: 'Ilık ☀️', en: 'Warm ☀️' },
    soguk: { tr: 'Soğuk ❄️', en: 'Cold ❄️' }
  }

  if (a.action_type === 'call') {
    return t('pipeline.activityCall')
  }
  if (a.action_type === 'whatsapp') {
    const labeled = getWhatsAppActivityDisplay(a, lang === 'en' ? 'en' : 'tr')
    if (labeled) return labeled
    return t('pipeline.activityWhatsApp')
  }
  if (a.action_type === 'ai_generate') {
    return t('pipelinePage.aiMessageGenerated')
  }
  if (a.action_type === 'stage_change') {
    const rawNote = (a.note || '').toLowerCase().trim()
    const stageKeyMap: Record<string, string> = {
      'yeni': 'yeni',
      'iletisim': 'iletisim',
      'iletişime geçildi': 'iletisim',
      'davetli': 'davetli',
      'davet edildi': 'davetli',
      'sunum': 'sunum',
      'sunum yapıldı': 'sunum',
      'takip': 'takip',
      'takipte': 'takip',
      'kararsiz': 'kararsiz',
      'kararsız': 'kararsiz',
      'katildi': 'katildi',
      'katıldı': 'katildi',
      'joined': 'katildi',
      'ilgilenmedi': 'ilgilenmedi',
      'pasif': 'pasif',
      'kayboldu': 'kayboldu',
      'kaybedildi': 'kayboldu'
    }
    const resolvedKey = stageKeyMap[rawNote] || rawNote
    const stageName = t(`stages.${resolvedKey}`) || a.note || ''
    return t('pipelinePage.stageChangedTo', { stage: stageName })
  }
  if (a.action_type === 'note') {
    if (a.note?.startsWith('system_note:candidate_created')) {
      return t('pipelinePage.candidateProfileCreated')
    }
    if (a.note?.startsWith('system_note:profile_update')) {
      return t('pipelinePage.profileDetailsUpdated')
    }
    if (a.note?.startsWith('system_note:warmth_change:')) {
      const parts = a.note.replace('system_note:warmth_change:', '').split('->')
      const oldW = warmthMap[parts[0]] ? warmthMap[parts[0]][lang === 'en' ? 'en' : 'tr'] : parts[0]
      const newW = warmthMap[parts[1]] ? warmthMap[parts[1]][lang === 'en' ? 'en' : 'tr'] : parts[1]
      return t('pipelinePage.warmthUpdated', { old: oldW, new: newW })
    }
    if (a.note?.startsWith('system_note:follow_up_change:')) {
      const parts = a.note.replace('system_note:follow_up_change:', '').split('->')
      const formatD = (val: string) => {
        if (val === 'none' || !val) return t('pipelinePage.none')
        try {
          return new Date(val).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        } catch { return val }
      }
      return t('pipelinePage.followUpDateChanged', { old: formatD(parts[0]), new: formatD(parts[1]) })
    }
    
    const displayNote = displayDailyActionNote(a, lang === 'en' ? 'en' : 'tr')
    return `${t('pipelinePage.leaderNoteAdded')}: "${displayNote}"`
  }
  return a.note || ''
}

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

  // Leader Notes states
  const [notesOpen, setNotesOpen] = useState(false)
  const [showAllNotes, setShowAllNotes] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [showAllActivity, setShowAllActivity] = useState(false)

  // AI Notes Summary states
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isSummaryPending, setIsSummaryPending] = useState(false)

  const queryClient = useQueryClient()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { data: presentationMaterials = [], isLoading: materialsLoading } = usePresentationMaterials(
    ws?.workspaceId,
    { isSuperAdmin: ws?.isSuperAdmin, lang, includeFallback: true }
  )
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const update = useUpdateCandidate(ws?.workspaceId ?? '')
  const del = useDeleteCandidate(ws?.workspaceId ?? '')
  const deleteActivityMutation = useDeleteActivity(ws?.workspaceId ?? '')
  const logPresentationWhatsApp = useLogPresentationWhatsApp(ws?.workspaceId ?? '')
  const { data: activityLog = [] } = useActivityHistory(candidateId)
  
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

  
  // Fetch leader notes and declare add note mutation
  const { data: notes = [] } = useCandidateNotes(candidateId)
  const leaderNotes = useMemo(() => notes.filter(isLeaderUserNote), [notes])
  const addNoteMutation = useAddCandidateNote(ws?.workspaceId ?? '')

  const handleGenerateSummary = async () => {
    if (leaderNotes.length === 0) return
    setIsSummaryPending(true)
    try {
      const rawNotes = leaderNotes.map(n => resolveDailyActionNote(n).noteTr)
      const res = await generateNotesSummary(rawNotes)
      if (res.error) {
        toast.error(res.error)
      } else if (res.summary) {
        setAiSummary(res.summary)
      }
    } catch {
      toast.error(t('pipelinePage.couldNotGenerateSummary'))
    } finally {
      setIsSummaryPending(false)
    }
  }

  const c = candidates.find(x => x.id === candidateId)
  const parsed = c
    ? resolveCandidateFields(c)
    : { noteTr: '', noteEn: '', avatarUrl: null as string | null, warmth: 'ilik' as const }

  const attemptedUpdates = useRef<Record<string, boolean>>({})
  const attemptedActionUpdates = useRef<Record<string, boolean>>({})

  // Lider notları otomatik geriye dönük çeviri ve kalıcı saklama tetikleyicisi
  useEffect(() => {
    if (lang !== 'en' || leaderNotes.length === 0) return

    leaderNotes.forEach(n => {
      const parsedN = resolveDailyActionNote(n)
      if (!parsedN.isSystem && !parsedN.noteEn && parsedN.noteTr && !attemptedActionUpdates.current[n.id]) {
        attemptedActionUpdates.current[n.id] = true

        translateNoteAction(parsedN.noteTr)
          .then(async (translated: string) => {
            if (translated) {
              const supabase = createClient()
              await supabase
                .from('nmm_daily_actions')
                .update(mergeDailyActionNoteUpdate(n, { noteEn: translated }))
                .eq('id', n.id)

              queryClient.invalidateQueries({ queryKey: ['candidate-notes', candidateId] })
              queryClient.invalidateQueries({ queryKey: ['activity', candidateId] })
            }
          })
          .catch(err => console.error('Lider notu otomatik çeviri hatası:', err))
      }
    })
  }, [lang, leaderNotes, candidateId, queryClient])

  // Popup açıldığında arka plan kaymasını önleme (body scroll-lock)
  useEffect(() => {
    if (stageOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [stageOpen])



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
  const candidatePhoneClean = c?.phone?.replace(/\D/g, '') ?? ''

  const activeMaterial = useMemo(() => {
    if (presentationMaterials.length === 0) return null
    if (selectedMaterialId) {
      return presentationMaterials.find(m => m.id === selectedMaterialId) ?? pickDefaultMaterial(presentationMaterials)
    }
    return pickDefaultMaterial(presentationMaterials)
  }, [presentationMaterials, selectedMaterialId])

  useEffect(() => {
    const defaultMaterial = pickDefaultMaterial(presentationMaterials)
    if (defaultMaterial && !selectedMaterialId) {
      setSelectedMaterialId(defaultMaterial.id)
    }
  }, [presentationMaterials, selectedMaterialId])

  const getPresentationMessage = useCallback(() => {
    const name = c?.full_name?.trim() || t('pipelinePage.customer')
    if (!activeMaterial) return ''
    return renderPresentationMessage(activeMaterial.whatsapp_template, {
      name,
      url: activeMaterial.url,
      sender: senderName,
    })
  }, [c, activeMaterial, senderName, t])

  const handleSendWhatsApp = useCallback(() => {
    if (!candidatePhoneClean || !activeMaterial || !c) return
    const msg = getPresentationMessage()
    navigator.clipboard.writeText(msg).then(() => toast.success(t('pipeline.presentationCopied'))).catch(() => {})
    window.open(`https://wa.me/${candidatePhoneClean}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
    logPresentationWhatsApp.mutate({
      candidateId: c.id,
      materialTitle: activeMaterial.title,
    })
  }, [candidatePhoneClean, activeMaterial, c, getPresentationMessage, t, logPresentationWhatsApp])

  const handleSendSms = useCallback(() => {
    if (!candidatePhoneClean || !activeMaterial) return
    const msg = getPresentationMessage()
    navigator.clipboard.writeText(msg).then(() => toast.success(t('pipeline.presentationCopied'))).catch(() => {})
    window.open(`sms:${candidatePhoneClean}?body=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
  }, [candidatePhoneClean, activeMaterial, getPresentationMessage, t])

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
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'

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

  const handleSaveNote = async () => {
    const textToSave = newNote.trim()
    if (!textToSave) return
    setNewNote('') // Clear input immediately for optimal UX response

    try {
      const translated = await translateNoteAction(textToSave)
      addNoteMutation.mutate({
        candidateId,
        noteTr: textToSave,
        noteEn: translated,
      })
    } catch {
      addNoteMutation.mutate({ candidateId, noteTr: textToSave })
    }
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
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
              <div className="flex items-center gap-4">
                <PersonAvatar
                  name={c.full_name}
                  imageUrl={parsed.avatarUrl}
                  size="xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold text-[var(--text-1)]">{c.full_name}</h1>
                    {parsed.warmth === 'sicak' && (
                      <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/30 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 animate-pulse">🔥 {t('pipelinePage.warmthHot')}</span>
                    )}
                    {parsed.warmth === 'ilik' && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">☀️ {t('pipelinePage.warmthWarm')}</span>
                    )}
                    {parsed.warmth === 'soguk' && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30">❄️ {t('pipelinePage.warmthCold')}</span>
                    )}
                  </div>
                  {c.phone && (
                    <p className="text-sm text-[var(--text-2)]">{c.phone}</p>
                  )}
                </div>
              </div>

              {c.note && (
                <p className={`mt-4 rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-2)] leading-relaxed transition-opacity ${isTranslating ? 'opacity-50' : 'opacity-100'}`}>
                  {lang === 'en' ? (translatedNote || parsed.noteEn || parsed.noteTr) : parsed.noteTr}
                  {isTranslating && (
                    <span className="ml-2 text-[10px] text-[var(--text-3)] animate-pulse">
                      {t('pipeline.noteTranslating')}
                    </span>
                  )}
                </p>
              )}
            </div>

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

            {/* Sunum Materyalleri */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
                    <Presentation className="h-3.5 w-3.5 text-[#534AB7]" />
                    {t('pipeline.presentationMaterials')}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-3)]">
                    {t('pipeline.presentationMaterialsDesc')}
                  </p>
                </div>
                <Link
                  href="/pipeline/sunum-materyalleri"
                  className="shrink-0 text-xs font-semibold text-[#534AB7] hover:underline whitespace-nowrap dark:text-[#F5F0E8] dark:hover:text-[#FFF8DC]"
                >
                  {t('presentationMaterialsPage.manageLink')}
                </Link>
              </div>

              {materialsLoading ? (
                <div className="mt-4 h-10 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
              ) : presentationMaterials.length === 0 ? (
                <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                  <p className="font-semibold">{t('presentationMaterialsPage.addFirst')}</p>
                </div>
              ) : (
                <>
                  <label className="mt-4 block space-y-1.5">
                    <span className="text-xs font-semibold text-[var(--text-2)]">
                      {t('presentationMaterialsPage.selectMaterial')}
                    </span>
                    <select
                      value={activeMaterial?.id ?? ''}
                      onChange={e => setSelectedMaterialId(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text-1)] outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/15"
                    >
                      {presentationMaterials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.title}
                          {material.is_default ? ` ★` : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  {activeMaterial && (
                    <p className="mt-3 rounded-xl bg-[var(--bg-subtle)] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-2)] whitespace-pre-wrap">
                      <span className="font-semibold text-[var(--text-1)]">
                        {t('presentationMaterialsPage.previewLabel')}:
                      </span>{' '}
                      {getPresentationMessage()}
                    </p>
                  )}
                </>
              )}

              {!candidatePhoneClean && (
                <p className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                  {t('pipeline.presentationWarning')}
                </p>
              )}

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  disabled={!candidatePhoneClean || !activeMaterial}
                  onClick={handleSendWhatsApp}
                  className="flex w-1/3 items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-4 text-sm font-semibold text-white transition hover:opacity-90 animate-all duration-200 active:scale-95 text-center disabled:pointer-events-none disabled:opacity-40 cursor-pointer shadow-md hover:shadow-green-500/20"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0" />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Lider Notu */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300">
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEEDFE] text-[#534AB7]">
                    <StickyNote className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-1)]">
                    {t('pipelinePage.leaderNote')}
                  </span>
                  {leaderNotes.length > 0 && (
                    <span className="rounded-full bg-[#EEEDFE] px-2 py-0.5 text-xs font-bold text-[#534AB7]">
                      {leaderNotes.length}
                    </span>
                  )}
                </div>
                {notesOpen ? (
                  <ChevronUp className="h-4 w-4 text-[var(--text-3)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--text-3)]" />
                )}
              </button>
              {notesOpen && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  {leaderNotes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-center text-xs text-[var(--text-3)]">
                      {t('pipelinePage.noLeaderNotes')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* YZ Özet & Aksiyon Planı Kartı */}
                      {leaderNotes.length > 0 && (
                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-950/40 dark:bg-indigo-950/15 space-y-2.5 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                              <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                              <span>{t('pipelinePage.aiMentorAnalysis')}</span>
                            </div>
                            {!aiSummary && (
                              <button
                                type="button"
                                disabled={isSummaryPending}
                                onClick={handleGenerateSummary}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition disabled:opacity-50 active:scale-95"
                              >
                                {isSummaryPending ? t('pipelinePage.analyzing') : t('pipelinePage.analyzeSummarize')}
                              </button>
                            )}
                          </div>
                          
                          {isSummaryPending && (
                            <div className="flex items-center gap-2 py-1">
                              <div className="h-1.5 w-1.5 animate-ping rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                              <span className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 font-semibold">
                                {t('pipelinePage.claudeReviewing')}
                              </span>
                            </div>
                          )}

                          {aiSummary && (
                            <div className="text-xs leading-relaxed text-indigo-950 dark:text-indigo-200 animate-in fade-in duration-300 space-y-2">
                              {(() => {
                                const parsedSummary = parseBilingualText(aiSummary)
                                const displaySummary =
                                  lang === 'en'
                                    ? parsedSummary.en || parsedSummary.tr
                                    : parsedSummary.tr
                                return <p className="font-medium whitespace-pre-wrap">{displaySummary}</p>
                              })()}
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={handleGenerateSummary}
                                  disabled={isSummaryPending}
                                  className="text-[9px] font-bold text-indigo-600/80 hover:text-indigo-800 dark:text-indigo-400/80 dark:hover:text-indigo-300 transition"
                                >
                                  {t('pipelinePage.reAnalyze')}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {!aiSummary && !isSummaryPending && (
                            <p className="text-[10px] leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
                              {t('pipelinePage.letAiAnalyze')}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="max-h-[350px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                        {(showAllNotes ? leaderNotes : leaderNotes.slice(0, 5)).map(n => {
                          const displayText = displayDailyActionNote(
                            n,
                            lang === 'en' ? 'en' : 'tr'
                          )
                          return (
                            <div
                              key={n.id}
                              className="rounded-xl bg-[var(--bg-subtle)] p-3 text-xs leading-relaxed text-[var(--text-2)] border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
                            >
                              <p className="whitespace-pre-wrap break-words">{displayText}</p>
                              <p className="mt-2 text-[9px] font-medium text-[var(--text-3)] tracking-wide">
                                {new Date(n.created_at).toLocaleDateString(locale, {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                      {leaderNotes.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowAllNotes(!showAllNotes)}
                          className="w-full text-center text-xs font-bold text-[#534AB7] hover:underline py-1 transition active:scale-95"
                        >
                          {showAllNotes
                            ? t('pipelinePage.showLess')
                            : t('pipelinePage.showAll')}
                        </button>
                      )}
                    </div>
                  )}
                  <div className="border-t border-[var(--border)] pt-4 space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder={t('pipelinePage.writeLeaderNotePlaceholder', { name: c.full_name })}
                      className="w-full min-h-[80px] max-h-[200px] rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-xs text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none focus:border-[#534AB7] transition-all"
                      rows={3}
                      maxLength={1000}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!newNote.trim() || addNoteMutation.isPending}
                        onClick={handleSaveNote}
                        className="flex items-center gap-1.5 rounded-xl bg-[#534AB7] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-40 shadow-md hover:shadow-indigo-500/10 active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {t('pipelinePage.saveNote')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Aktivite Geçmişi */}
            {activityLog.length > 0 && (
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
            )}

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
                  {!editingFollowUp && (
                    <button
                      onClick={() => {
                        setEditingFollowUp(true)
                        setTempFollowUp(toInputDateTime(c.next_follow_up_at))
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--text-3)] transition hover:text-[#534AB7]"
                      title={t('common.edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex-1 flex flex-col justify-end">
                  {editingFollowUp ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="datetime-local"
                        value={tempFollowUp}
                        onChange={e => setTempFollowUp(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-2 py-1.5 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7]"
                        autoFocus
                      />
                      <button
                        onClick={() => saveFollowUpDate(tempFollowUp)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600 transition shadow-sm"
                        title={t('common.save')}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingFollowUp(false)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
                        title={t('common.cancel')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between w-full">
                      <p className="text-sm font-semibold text-[#534AB7] truncate">
                        {nextFollow ?? '—'}
                      </p>
                      <span className="text-[10px] text-[var(--text-3)] shrink-0 ml-1">
                        ({daysSince(c.last_contact_at, t)})
                      </span>
                    </div>
                  )}
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

      {activityToDelete && (
        <ConfirmDeleteModal
          message={t('pipelinePage.confirmDeleteActivity')}
          onConfirm={handleActivityDeleteConfirmed}
          onCancel={() => setActivityToDelete(null)}
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
