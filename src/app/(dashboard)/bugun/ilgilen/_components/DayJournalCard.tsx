'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  readDayJournal,
  writeDayJournal,
} from '@/lib/domain/dayRitual'
import { parseSimpleNote } from '@/lib/utils/noteParser'
import {
  getDayJournalAction,
  mergeDayJournalLangAction,
  polishDayJournalAction,
} from '../actions/journal'

type JournalState = { text: string; hydrated: boolean }
type JournalAction =
  | { type: 'hydrate'; text: string }
  | { type: 'update'; text: string }

function journalReducer(state: JournalState, action: JournalAction): JournalState {
  if (action.type === 'hydrate') return { text: action.text, hydrated: true }
  return { ...state, text: action.text }
}

function displayTextFromContent(content: string, lang: 'tr' | 'en'): string {
  const parsed = parseSimpleNote(content)
  return lang === 'en' ? (parsed.en || parsed.tr) : (parsed.tr || parsed.en)
}

export function DayJournalCard() {
  const { t, lang } = useTranslation()
  const { data: ws } = useWorkspace()
  const userId = ws?.userId
  const [{ text, hydrated }, dispatch] = useReducer(journalReducer, { text: '', hydrated: false })
  const [polishing, setPolishing] = useState(false)
  const migratedRef = useRef(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      const remote = await getDayJournalAction()
      if (cancelled) return

      if ('content' in remote && remote.content.trim()) {
        dispatch({ type: 'hydrate', text: displayTextFromContent(remote.content, lang) })
        writeDayJournal(userId!, displayTextFromContent(remote.content, lang))
        return
      }

      const local = readDayJournal(userId!)
      dispatch({ type: 'hydrate', text: local })

      if (local.trim() && !migratedRef.current) {
        migratedRef.current = true
        void mergeDayJournalLangAction(local, lang)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId, lang])

  useEffect(() => {
    if (!userId || !hydrated) return
    const id = window.setTimeout(() => {
      writeDayJournal(userId, text)
      void mergeDayJournalLangAction(text, lang)
    }, 400)
    return () => window.clearTimeout(id)
  }, [text, userId, hydrated, lang])

  async function handlePolish() {
    if (!text.trim()) return
    setPolishing(true)
    try {
      const result = await polishDayJournalAction(text, lang)
      if (result.error) {
        if (result.error !== 'empty') toast.error(result.error)
        return
      }
      if (result.text) {
        dispatch({ type: 'update', text: result.text })
        writeDayJournal(userId!, result.text)
        toast.success(t('dashboard.journalPolished'))
      }
    } finally {
      setPolishing(false)
    }
  }

  if (!hydrated || !userId) return null

  return (
    <div
      id="journal"
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5 scroll-mt-24"
    >
      <h3 className="text-sm font-bold text-[var(--text-1)]">{t('dashboard.journalTitle')}</h3>
      <p className="mt-0.5 text-xs text-[var(--text-3)]">{t('dashboard.journalSubtitle')}</p>
      <textarea
        value={text}
        onChange={e => dispatch({ type: 'update', text: e.target.value })}
        rows={4}
        placeholder={t('dashboard.journalPlaceholder')}
        className="mt-3 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)] focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
      />
      <button
        type="button"
        onClick={handlePolish}
        disabled={polishing || !text.trim()}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#534AB7]/30 bg-[#EEEDFE]/80 px-4 py-2.5 text-sm font-semibold text-[#534AB7] transition hover:bg-[#EEEDFE] disabled:opacity-50 dark:bg-[#2d2a5e]/50 dark:text-[#a09be8]"
      >
        {polishing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {t('dashboard.journalPolish')}
      </button>
    </div>
  )
}
