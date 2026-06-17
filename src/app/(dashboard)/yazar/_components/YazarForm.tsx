'use client'

import { useActionState, useState, useRef, useEffect, useCallback } from 'react'
import { Copy, Loader2, Bot, Lock } from 'lucide-react'
import { generateMessageAction, translateTextAction, getCandidateRecentActionsAction } from '../actions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { formatCandidateContextForYazar } from '@/lib/domain/yazarCandidateContext'

import { waHref, whatsappShareUrl } from '@/lib/utils/waLink'
import { readUserScopedJSON, writeUserScopedJSON } from '@/lib/ui/userScopedStorage'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'
import { useTranslation } from '@/providers/LanguageProvider'
import { useAILimits } from '@/hooks/useAILimits'
import { formatCreditButtonLabel } from '@/lib/domain/aiUsage'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { AI_USER_INPUT_MAX_CHARS } from '@/lib/domain/aiInputLimit'
import type { NmmCandidate } from '@/types/database.types'
import { MessageHistorySection, type HistoryEntry } from './MessageHistorySection'
import { CandidateSearchCombobox } from './CandidateSearchCombobox'
import { YazarTypeToneFields } from './YazarTypeToneFields'

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
    setWarmth(parsed.warmth || 'ilik')

    getCandidateRecentActionsAction(c.id)
      .catch(() => [])
      .then(rawActions => {
        setContext(formatCandidateContextForYazar(c, rawActions, lang, t))
      })
  }, [lang, t])


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

        <YazarTypeToneFields
          messageType={messageType}
          tone={tone}
          lang={lang}
          messageTypeLabel={t('coachUi.messageType')}
          toneLabel={t('coachUi.tone')}
          onMessageTypeChange={setMessageType}
          onToneChange={setTone}
        />

        <CandidateSearchCombobox
          query={query}
          selected={selected}
          dropdownOpen={dropdownOpen}
          filtered={filtered}
          lang={lang}
          containerRef={containerRef}
          label={t('coachUi.candidate')}
          placeholder={t('coachUi.candidatePlaceholder')}
          noCandidatesLabel={t('coachUi.noCandidates')}
          onQueryChange={setQuery}
          onDropdownOpen={setDropdownOpen}
          onSelect={selectCandidate}
          onClear={clearSelection}
        />

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

