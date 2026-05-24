'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Pencil, ChevronDown, Trash2, X, Bot, History, PhoneCall, MessageSquare, Presentation, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, useUpdateCandidate, useDeleteCandidate, useActivityHistory } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { EditCandidateSheet } from '../../_components/EditCandidateSheet'
import { toast } from 'sonner'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { STAGE_LABEL, STAGE_COLOR, STAGE_ORDER, FOLLOW_DAYS } from '@/lib/stages'
import { deleteWithUndo } from '@/lib/deleteWithUndo'
import { waHref } from '@/lib/waLink'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { Z } from '@/lib/zIndex'
import { useTranslation } from '@/providers/LanguageProvider'
import { parseNote, formatNote } from '@/lib/noteParser'


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

// parseNote is now imported from @/lib/noteParser

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
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const update = useUpdateCandidate(ws?.workspaceId ?? '')
  const del = useDeleteCandidate(ws?.workspaceId ?? '')
  const { data: activityLog = [] } = useActivityHistory(candidateId)

  const c = candidates.find(x => x.id === candidateId)
  const parsed = c ? parseNote(c.note) : { tr: '', en: '', avatarUrl: '' }
  const profilePhoto = parsed.avatarUrl || null

  const attemptedUpdates = useRef<Record<string, boolean>>({})

  // Not çevirisi: EN modunda kalıcı ve cache'li AI çevirisi
  useEffect(() => {
    if (lang !== 'en' || !c?.note) {
      setTranslatedNote(null)
      return
    }

    const parsedLocal = parseNote(c.note)
    if (parsedLocal.en) {
      setTranslatedNote(parsedLocal.en)
      return
    }

    let h = 0
    const rawText = parsedLocal.tr
    for (let i = 0; i < rawText.length; i++) h = (Math.imul(31, h) + rawText.charCodeAt(i)) | 0
    const cacheKey = `nmm_note_en_${candidateId}_${(h >>> 0).toString(36)}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      setTranslatedNote(cached)
      // Veritabanına da kaydet ki diğer cihazlarda veya localstorage temizlendiğinde çalışsın
      if (!attemptedUpdates.current[candidateId]) {
        attemptedUpdates.current[candidateId] = true
        update.mutate({ id: c.id, note: formatNote(parsedLocal.tr, cached, parsedLocal.avatarUrl) })
      }
      return
    }

    if (isTranslating || attemptedUpdates.current[candidateId]) {
      return
    }

    setIsTranslating(true)
    fetch('/api/translate-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: parsedLocal.tr }),
    })
      .then(r => r.json())
      .then(({ translated }: { translated: string }) => {
        setTranslatedNote(translated)
        localStorage.setItem(cacheKey, translated)
        // Veritabanına kalıcı olarak kaydet
        if (!attemptedUpdates.current[candidateId]) {
          attemptedUpdates.current[candidateId] = true
          update.mutate({ id: c.id, note: formatNote(parsedLocal.tr, translated, parsedLocal.avatarUrl) })
        }
      })
      .catch(() => setTranslatedNote(parsedLocal.tr))
      .finally(() => setIsTranslating(false))
  }, [lang, c?.note, candidateId, update, isTranslating])

  const GREENLEAF_PRESENTATION_URL = 'https://www.suattayfuntopak.com/greenleaf-sunumu'
  const senderName = ws?.fullName || (lang === 'en' ? 'Your Advisor' : 'Danışmanınız')
  const candidatePhoneClean = c?.phone?.replace(/\D/g, '') ?? ''

  const getPresentationMessage = useCallback(() => {
    const name = c?.full_name?.trim() || (lang === 'en' ? 'Customer' : 'Müşteri')
    return t('pipeline.presentationMessageTemplate', { name, url: GREENLEAF_PRESENTATION_URL, sender: senderName })
  }, [c, lang, senderName, t])

  const handleSendWhatsApp = useCallback(() => {
    if (!candidatePhoneClean) return
    const msg = getPresentationMessage()
    navigator.clipboard.writeText(msg).then(() => toast.success(t('pipeline.presentationCopied'))).catch(() => {})
    window.open(`https://wa.me/${candidatePhoneClean}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
  }, [candidatePhoneClean, getPresentationMessage, t])

  const handleSendSms = useCallback(() => {
    if (!candidatePhoneClean) return
    const msg = getPresentationMessage()
    navigator.clipboard.writeText(msg).then(() => toast.success(t('pipeline.presentationCopied'))).catch(() => {})
    window.open(`sms:${candidatePhoneClean}?body=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
  }, [candidatePhoneClean, getPresentationMessage, t])

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
  const nextFollow = c.next_follow_up_at
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

  const handleConfirmCancel = useCallback(() => setConfirmOpen(false), [])

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

        {/* Profil kartı */}
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-4">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={c.full_name}
                className="h-16 w-16 shrink-0 rounded-full object-cover border-2 border-[#EEEDFE]"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xl font-bold text-[#534AB7]">
                {c.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-[var(--text-1)]">{c.full_name}</h1>
              {c.phone && (
                <p className="text-sm text-[var(--text-2)]">{c.phone}</p>
              )}
            </div>
          </div>

          {c.note && (
            <p className={`mt-4 rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-2)] leading-relaxed transition-opacity ${isTranslating ? 'opacity-50' : 'opacity-100'}`}>
              {lang === 'en' ? (translatedNote || parsed.en || parsed.tr) : parsed.tr}
              {isTranslating && (
                <span className="ml-2 text-[10px] text-[var(--text-3)] animate-pulse">
                  {t('pipeline.noteTranslating')}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Aksiyon butonları */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push(`/yazar?name=${encodeURIComponent(c.full_name)}&note=${encodeURIComponent(parsed.tr)}`)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#EEEDFE] py-4 text-sm font-semibold text-[#534AB7] transition hover:opacity-90"
          >
            <Bot className="h-4 w-4" strokeWidth={1.75} />
            {t('pipeline.aiMessage')}
          </button>
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-4 text-sm font-semibold text-white transition hover:opacity-90"
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
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#E8F0FE] py-4 text-sm font-semibold text-[#1A56DB] transition hover:opacity-90"
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
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
              <Presentation className="h-3.5 w-3.5 text-[#534AB7]" />
              {t('pipeline.presentationMaterials')}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-3)]">
              {t('pipeline.presentationMaterialsDesc')}
            </p>
          </div>

          {!candidatePhoneClean && (
            <p className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              {t('pipeline.presentationWarning')}
            </p>
          )}

          <div className="mt-4 grid w-full grid-cols-2 items-stretch gap-2.5">
            <button
              type="button"
              disabled={!candidatePhoneClean}
              onClick={handleSendSms}
              className="flex w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-white transition-all bg-sky-600 hover:bg-sky-500 shadow-md hover:shadow-sky-500/20 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="text-center leading-tight">{t('pipeline.shareSms')}</span>
            </button>
            <button
              type="button"
              disabled={!candidatePhoneClean}
              onClick={handleSendWhatsApp}
              className="flex w-full min-h-[2.75rem] items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold text-white transition-all bg-[#25D366] hover:bg-[#20BD5A] shadow-md hover:shadow-green-500/20 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <WhatsAppIcon className="h-4 w-4 shrink-0" />
              <span className="text-center leading-tight">{t('pipeline.shareWhatsapp')}</span>
            </button>
          </div>
        </div>

        {/* Aktivite Geçmişi */}
        {activityLog.length > 0 && (
          <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
              <History className="h-3.5 w-3.5" />
              {t('pipeline.activityHistory')}
            </p>
            <ul className="space-y-2">
              {activityLog.map(a => (
                <li key={a.id} className="flex items-center gap-2.5 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)]">
                    {a.action_type === 'call'         && <PhoneCall className="h-3.5 w-3.5 text-[#534AB7]" />}
                    {a.action_type === 'whatsapp'     && <MessageSquare className="h-3.5 w-3.5 text-[#25D366]" />}
                    {a.action_type === 'note'         && <Pencil className="h-3.5 w-3.5 text-[var(--text-3)]" />}
                    {a.action_type === 'stage_change' && <ChevronDown className="h-3.5 w-3.5 text-[#854F0B]" />}
                  </span>
                  <span className="flex-1 text-[var(--text-2)]">
                    {a.action_type === 'call'         && t('pipeline.activityCall')}
                    {a.action_type === 'whatsapp'     && 'WhatsApp'}
                    {a.action_type === 'note'         && t('pipeline.activityNote')}
                    {a.action_type === 'stage_change' && t('pipeline.activityStageChange')}
                    {a.note && <span className="text-[var(--text-3)]"> — {a.note}</span>}
                  </span>
                  <span className="shrink-0 text-[10px] text-[var(--text-3)]">
                    {new Date(a.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Alt Yerleşim Grubu (Aşama, Takip ve Sil Butonları 3'lü Grid) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          
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
