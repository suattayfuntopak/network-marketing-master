'use client'

import { useActionState, useState, useRef, useEffect, useCallback } from 'react'
import { Copy, Loader2, Bot, X, ChevronDown, Lock } from 'lucide-react'
import { generateMessageAction, translateTextAction, getCandidateRecentActionsAction } from '../actions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { getStageLabel } from '@/lib/domain/stages'

import { waHref, whatsappShareUrl } from '@/lib/utils/waLink'
import { readUserScopedJSON, writeUserScopedJSON } from '@/lib/ui/userScopedStorage'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'
import { useTranslation } from '@/providers/LanguageProvider'
import { useAILimits } from '@/hooks/useAILimits'
import { formatCreditButtonLabel } from '@/lib/domain/aiUsage'
import { Z } from '@/lib/ui/zIndex'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { displayDailyActionNote, isLeaderUserNote, getWhatsAppActivityDisplay } from '@/lib/domain/dailyActionNote'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { AI_USER_INPUT_MAX_CHARS } from '@/lib/domain/aiInputLimit'
import { MESSAGE_TYPES, TONES, getMessageTypeLabel, getToneLabel } from './yazarFormLabels'
import { MessageHistorySection, type HistoryEntry } from './MessageHistorySection'

const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#0F6E56] focus:ring-2 focus:ring-[#E1F5EE]'

// Mesaj geçmişi cihaz-yerel scratchpad'tir; userId ile izole edilir (genel
// userScopedStorage helper'ı) → aynı tarayıcıda kullanıcı değişince sızmaz.
const HISTORY_BASE = 'nmm_message_history'
const MAX_HISTORY = 5

function loadHistory(userId: string | undefined | null): HistoryEntry[] {
  return readUserScopedJSON<HistoryEntry[]>(HISTORY_BASE, userId, [])
}

function saveToHistory(userId: string | undefined | null, entry: HistoryEntry) {
  if (!userId) return
  const updated = [entry, ...loadHistory(userId)].slice(0, MAX_HISTORY)
  writeUserScopedJSON(HISTORY_BASE, userId, updated)
}

interface Props {
  initialName?: string
  initialNote?: string
  initialWarmth?: string
}

export function YazarForm({ initialName = '', initialNote = '', initialWarmth = 'ilik' }: Props) {
  const { t, lang } = useTranslation()

  const cleanInitialNote = initialNote ? initialNote.split('|||')[0].trim() : '' // URL param: plain TR text
  const [state, action, isPending] = useActionState(generateMessageAction, {})
  const [query, setQuery] = useState(initialName)
  const [selected, setSelected] = useState<NmmCandidate | null>(null)
  const [context, setContext] = useState(cleanInitialNote)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [messageType, setMessageType] = useState('genel')
  const [tone, setTone] = useState('samimi')
  const [warmth, setWarmth] = useState<'sicak' | 'ilik' | 'soguk'>(() => {
    if (initialWarmth === 'sicak' || initialWarmth === 'ilik' || initialWarmth === 'soguk') {
      return initialWarmth
    }
    return 'ilik'
  })
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // Real-time automatic translation state
  const [displayedMessage, setDisplayedMessage] = useState('')
  const [generatedLang, setGeneratedLang] = useState<'tr' | 'en'>(lang)
  const [translating, setTranslating] = useState(false)

  const { data: ws } = useWorkspace()
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()
  const {
    dailyLimit,
    isSuperAdmin,
    aiUsed,
    aiRemaining: remaining,
  } = useAILimits()
  const qc = useQueryClient()
  const limitReached = !isSuperAdmin && remaining <= 0

  const containerRef = useRef<HTMLDivElement>(null)
  const messageBoxRef = useRef<HTMLDivElement>(null)
  const prefilledRef = useRef(false)
  const prevMessageRef = useRef<string | undefined>(undefined)

  const { candidates = [] } = useCandidates(ws?.workspaceId)

  const fetchAndFormatCandidateContext = useCallback((c: NmmCandidate) => {
    setSelected(c)
    setQuery('')
    setDropdownOpen(false)

    const parsed = resolveCandidateFields(c)
    const parsedNote = lang === 'en' ? (parsed.noteEn || parsed.noteTr) : parsed.noteTr
    setWarmth(parsed.warmth || 'ilik')
    const stageName = getStageLabel(c.stage, lang) || c.stage

    const warmthMap: Record<string, string> = {
      sicak: lang === 'en' ? 'Hot 🔥' : 'Sıcak (Hot) 🔥',
      ilik: lang === 'en' ? 'Warm ☀️' : 'Ilık (Warm) ☀️',
      soguk: lang === 'en' ? 'Cold ❄️' : 'Soğuk (Cold) ❄️'
    }
    const warmthText = warmthMap[parsed.warmth || 'ilik']

    getCandidateRecentActionsAction(c.id)
      .catch(() => [])
      .then(rawActions => {
        // Leader notes (non-system notes)
        const leaderNotes = rawActions.filter(a => isLeaderUserNote(a))
        // Activities
        const activities = rawActions.slice(0, 5)

        const notesText = leaderNotes.length > 0
          ? (lang === 'en' ? '\n\nLeader Notes:\n' : '\n\nLider Notları:\n') +
            leaderNotes
              .map(n => `- ${displayDailyActionNote(n, lang === 'en' ? 'en' : 'tr')}`)
              .join('\n')
          : ''

        const activityLines = activities.map(a => {
          const dateStr = new Date(a.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'short' })
          const actionText = a.action_type === 'call' ? (lang === 'en' ? 'Phone Call' : 'Telefon Araması')
            : a.action_type === 'whatsapp'
              ? getWhatsAppActivityDisplay(a, lang === 'en' ? 'en' : 'tr')
                ?? (lang === 'en' ? 'WhatsApp · Message sent' : 'WhatsApp · Mesaj gönderildi')
            : a.action_type === 'ai_generate' ? (lang === 'en' ? 'AI Message Generated' : 'YZ Mesajı Üretildi')
            : a.action_type === 'stage_change' ? (lang === 'en' ? `Stage changed: ${getStageLabel(a.note as CandidateStage, lang) || a.note}` : `Aşama değişti: ${getStageLabel(a.note as CandidateStage, lang) || a.note}`)
            : a.note?.startsWith('system_note:candidate_created') ? (lang === 'en' ? 'Candidate profile created' : 'Aday profili oluşturuldu')
            : a.note?.startsWith('system_note:profile_update') ? (lang === 'en' ? 'Profile updated' : 'Profil güncellendi')
            : a.note?.startsWith('system_note:warmth_change:') ? (lang === 'en' ? 'Relationship level updated' : 'Sıcaklık derecesi güncellendi')
            : a.note?.startsWith('system_note:follow_up_change:') ? (lang === 'en' ? 'Follow-up date updated' : 'Takip tarihi güncellendi')
            : a.note?.startsWith('system_note:follow_up_cleared:') ? (lang === 'en' ? 'Follow-up reminder cleared' : 'Takip hatırlatması kapatıldı')
            : a.note?.startsWith('system_note:') ? (lang === 'en' ? 'System activity recorded' : 'Sistem aktivitesi kaydedildi')
            : a.note || (lang === 'en' ? 'Note Added' : 'Not Eklendi')
          return `- ${dateStr}: ${actionText}`
        }).join('\n')

        const activitiesText = activities.length > 0
          ? (lang === 'en' ? '\n\nRecent Activities:\n' : '\n\nSon Aktiviteler:\n') + activityLines
          : ''

        const infoText = lang === 'en'
          ? `Candidate: ${c.full_name}\nRelationship: ${warmthText}\nStage: ${stageName}${parsedNote ? `\nNotes: ${parsedNote}` : ''}${notesText}${activitiesText}\n\n`
          : `Aday: ${c.full_name}\nİlişki Derecesi: ${warmthText}\nAşama: ${stageName}${parsedNote ? `\nNotlar: ${parsedNote}` : ''}${notesText}${activitiesText}\n\n`
        setContext(infoText)
      })
  }, [lang])


  // Kullanıcı belli olunca userId-izole history'yi yükle.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setHistory(loadHistory(ws?.userId)) }, [ws?.userId])

  useEffect(() => {
    if (initialName && candidates.length > 0 && !prefilledRef.current) {
      const match = candidates.find(
        c => c.full_name.toLowerCase() === initialName.toLowerCase()
      )
      if (match) {
        /* eslint-disable-next-line react-hooks/set-state-in-effect */
        fetchAndFormatCandidateContext(match)
      } else if (cleanInitialNote) {
        setContext(cleanInitialNote)
      }
      prefilledRef.current = true
    }
  }, [initialName, candidates, cleanInitialNote, fetchAndFormatCandidateContext])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    if (state.message && state.message !== prevMessageRef.current) {
      prevMessageRef.current = state.message
      setDisplayedMessage(state.message)
      setGeneratedLang(lang)
      invalidateTeamAndAIUsage(qc, ws?.workspaceId)
      const entry: HistoryEntry = {
        message: state.message,
        candidateName: selected?.full_name ?? query ?? 'Kişisiz',
        messageType,
        timestamp: Date.now(),
      }
      saveToHistory(ws?.userId, entry)
      setHistory(loadHistory(ws?.userId))
    }
  }, [state.message, selected, query, messageType, qc, lang, ws?.userId, ws?.workspaceId])

  // Handle global language toggle auto-translation
  useEffect(() => {
    if (displayedMessage && lang !== generatedLang) {
      let active = true
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setTranslating(true)
      
      translateTextAction(displayedMessage, lang)
        .then(res => {
          if (active && res.translatedText) {
            setDisplayedMessage(res.translatedText)
            setGeneratedLang(lang)
          }
        })
        .catch(err => {
          console.error('Auto-translation failed:', err)
        })
        .finally(() => {
          if (active) setTranslating(false)
        })

      return () => {
        active = false
      }
    }
  }, [lang, displayedMessage, generatedLang])

  useEffect(() => {
    if (displayedMessage) {
      setTimeout(() => {
        messageBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [displayedMessage])

  const sorted = [...candidates].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, 'tr')
  )
  const filtered = sorted.filter(c =>
    c.full_name.toLowerCase().includes(query.toLowerCase())
  )

  function selectCandidate(c: NmmCandidate) {
    fetchAndFormatCandidateContext(c)
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
    setContext('')
    setWarmth('ilik')
  }

  function handleCopy() {
    if (displayedMessage) {
      navigator.clipboard.writeText(displayedMessage)
      toast.success('Mesaj kopyalandı!')
    }
  }

  const waLink = selected?.phone
    ? waHref(selected.phone, displayedMessage) 
    : whatsappShareUrl(displayedMessage)

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-5">
        <input type="hidden" name="messageType" value={messageType} />
        <input type="hidden" name="tone" value={tone} />
        <input type="hidden" name="warmth" value={warmth} />
        <input type="hidden" name="stage" value={selected?.stage ?? ''} />
        <input type="hidden" name="name" value={selected?.full_name ?? query} />

        {/* Mesaj Türü + Ton Dropdown'ları */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]" htmlFor="messageTypeSelect">
              {t('coachUi.messageType')}
            </label>
            <div className="relative">
              <select
                id="messageTypeSelect"
                value={messageType}
                onChange={e => setMessageType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg-card)] pl-4 pr-10 py-3 text-sm text-[var(--text-1)] outline-none transition focus:border-[#0F6E56] focus:ring-2 focus:ring-[#E1F5EE]"
              >
                {MESSAGE_TYPES.map(t => (
                  <option key={t.value} value={t.value} className="bg-[var(--bg-card)] text-[var(--text-1)]">
                    {getMessageTypeLabel(t.value, lang)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]" htmlFor="toneSelect">
              {t('coachUi.tone')}
            </label>
            <div className="relative">
              <select
                id="toneSelect"
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg-card)] pl-4 pr-10 py-3 text-sm text-[var(--text-1)] outline-none transition focus:border-[#0F6E56] focus:ring-2 focus:ring-[#E1F5EE]"
              >
                {TONES.map(t => (
                  <option key={t.value} value={t.value} className="bg-[var(--bg-card)] text-[var(--text-1)]">
                    {getToneLabel(t.value, lang)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Kişi — inline combobox */}
        <div ref={containerRef} className="relative">
          <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]">
            {t('coachUi.candidate')}
          </label>

          {selected ? (
            <div className="flex items-center justify-between rounded-xl border border-[#0F6E56] bg-[var(--bg-card)] px-4 py-3 ring-2 ring-[#E1F5EE]">
              <div>
                <p className="text-sm font-semibold text-[var(--text-1)]">{selected.full_name}</p>
                <p className="text-xs text-[var(--text-3)]">{getStageLabel(selected.stage, lang)}</p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] transition hover:text-[var(--text-1)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => { if (query) setDropdownOpen(true) }}
              placeholder={t('coachUi.candidatePlaceholder')}
              autoComplete="off"
              className={inputClass}
            />
          )}

          {dropdownOpen && !selected && query.length > 0 && (
            <div
              className={`absolute left-0 right-0 top-full ${Z.dropdown} mt-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl`}
              style={{ maxHeight: '240px', overflowY: 'auto' }}
            >
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--text-3)]">
                  {t('coachUi.noCandidates')}
                </p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selectCandidate(c)}
                    className="flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--bg-subtle)] last:border-b-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-bold text-brand">
                      {c.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
                      {c.phone && <p className="text-xs text-[var(--text-3)]">{c.phone}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-subtle px-2 py-0.5 text-[10px] font-semibold text-brand">
                      {getStageLabel(c.stage as CandidateStage, lang)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Ek bilgi */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]" htmlFor="context">
            {t('coachUi.extraContext')}{' '}
            <span className="text-xs font-normal text-[var(--text-3)]">({t('coachUi.optional')})</span>
          </label>
          <textarea
            id="context"
            name="context"
            rows={4}
            maxLength={AI_USER_INPUT_MAX_CHARS}
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder={t('coachUi.extraContextPlaceholder')}
            className={`${inputClass} resize-none`}
          />
        </div>

        {state.error && (
          <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">{state.error}</p>
        )}

        {!hasAiFieldAccess ? (
          <button
            type="button"
            onClick={() => openUpgrade('ai_field')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F6E56] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0a5a44]"
            title={t('pagesUi.unlockAiBasic')}
          >
            <Lock className="h-4 w-4" />
            {t('pagesUi.unlockAiBasic')}
          </button>
        ) : limitReached ? (
          <div className="rounded-xl bg-[#FBEAF0] px-4 py-3 text-sm text-[#72243E]">
            {t('coachUi.dailyLimitMessage', { limit: dailyLimit })}
          </div>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F6E56] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0a5a44] disabled:opacity-60"
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('coachUi.writing')}</>
              : (
                <>
                  <Bot className="h-4 w-4" />{' '}
                  {formatCreditButtonLabel(
                    t('coachUi.generate'),
                    aiUsed,
                    dailyLimit,
                    isSuperAdmin,
                    lang
                  )}
                </>
              )
            }
          </button>
        )}
      </form>

      {displayedMessage && (
        <div ref={messageBoxRef} className="rounded-2xl border border-[#D2EFE4] bg-[#F4FBF8] dark:border-[#2d5a47] dark:bg-[#1a2e28] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0F6E56]">
              {t('coachUi.generatedMessage')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
              >
                <Copy className="h-3.5 w-3.5" />
                {t('coachUi.copy')}
              </button>
              {waLink && (
                <button
                  onClick={() => window.open(waLink, '_blank')}
                  className="flex items-center gap-1.5 rounded-lg bg-whatsapp px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  WhatsApp
                </button>
              )}
            </div>
          </div>
          <div className="relative whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-1)]">
            {translating ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#0F6E56]" />
                <span className="text-xs font-semibold text-[#0F6E56]/70 animate-pulse">
                  {t('coachUi.translatingMessage')}
                </span>
              </div>
            ) : (
              displayedMessage
            )}
          </div>
        </div>
      )}

      {/* Mesaj Geçmişi */}
      <MessageHistorySection history={history} />
      {UpgradePrompt}
    </div>
  )
}

