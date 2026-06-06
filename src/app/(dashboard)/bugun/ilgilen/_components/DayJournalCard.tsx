'use client'

import { useEffect, useReducer, useRef, useState, useCallback } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  readDayJournal,
  writeDayJournal,
  todayKey,
} from '@/lib/domain/dayRitual'
import {
  dequeueJournalSync,
  enqueueJournalSync,
  readJournalSyncQueue,
} from '@/lib/domain/journalSyncQueue'
import { parseSimpleNote } from '@/lib/utils/noteParser'
import { mergeJournalConflictTexts } from '@/lib/domain/journalMerge'
import {
  getDayJournalAction,
  mergeDayJournalLangAction,
  polishDayJournalAction,
} from '../actions/journal'

type JournalState = { text: string; hydrated: boolean; conflictRemote: string | null }
type JournalAction =
  | { type: 'hydrate'; text: string }
  | { type: 'update'; text: string }
  | { type: 'conflict'; local: string; remote: string }
  | { type: 'resolveConflict'; text: string }

function journalReducer(state: JournalState, action: JournalAction): JournalState {
  if (action.type === 'hydrate') {
    return { text: action.text, hydrated: true, conflictRemote: null }
  }
  if (action.type === 'conflict') {
    return { text: action.local, hydrated: true, conflictRemote: action.remote }
  }
  if (action.type === 'resolveConflict') {
    return { text: action.text, hydrated: true, conflictRemote: null }
  }
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
  const [{ text, hydrated, conflictRemote }, dispatch] = useReducer(journalReducer, {
    text: '',
    hydrated: false,
    conflictRemote: null,
  })
  const [polishing, setPolishing] = useState(false)
  const migratedRef = useRef(false)
  const syncToastShownRef = useRef(false)

  const showSyncSuccessToast = useCallback(
    (synced: number) => {
      if (synced <= 0 || syncToastShownRef.current) return
      syncToastShownRef.current = true
      toast.success(t('dashboard.journalSyncedCloud'))
      window.setTimeout(() => {
        syncToastShownRef.current = false
      }, 5000)
    },
    [t],
  )

  const flushJournalQueue = useCallback(async (): Promise<number> => {
    if (!userId) return 0
    let synced = 0
    for (const item of readJournalSyncQueue()) {
      if (item.userId !== userId) continue
      const result = await mergeDayJournalLangAction(item.text, item.lang)
      if ('ok' in result) {
        dequeueJournalSync(item.userId, item.journalDate)
        synced++
      }
    }
    return synced
  }, [userId])

  const persistJournal = useCallback(
    async (value: string, uid: string, journalLang: 'tr' | 'en') => {
      const journalDate = todayKey()
      writeDayJournal(uid, value)
      const result = await mergeDayJournalLangAction(value, journalLang)
      if ('error' in result) {
        enqueueJournalSync({ userId: uid, journalDate, text: value, lang: journalLang })
        toast.message(t('dashboard.journalSavedLocal'))
        return
      }
      dequeueJournalSync(uid, journalDate)
    },
    [t],
  )

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      const synced = await flushJournalQueue()
      if (!cancelled) showSyncSuccessToast(synced)
      const remote = await getDayJournalAction()
      if (cancelled) return

      const local = readDayJournal(userId!)
      const remoteText =
        'content' in remote && remote.content.trim()
          ? displayTextFromContent(remote.content, lang)
          : ''

      if (local.trim() && remoteText && local.trim() !== remoteText.trim()) {
        dispatch({ type: 'conflict', local, remote: remoteText })
        return
      }

      if (remoteText) {
        dispatch({ type: 'hydrate', text: remoteText })
        writeDayJournal(userId!, remoteText)
        return
      }

      dispatch({ type: 'hydrate', text: local })

      if (local.trim() && !migratedRef.current) {
        migratedRef.current = true
        void persistJournal(local, userId!, lang)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId, lang, flushJournalQueue, persistJournal, showSyncSuccessToast])

  useEffect(() => {
    if (!userId || !hydrated || conflictRemote) return
    const id = window.setTimeout(() => {
      void persistJournal(text, userId, lang)
    }, 400)
    return () => window.clearTimeout(id)
  }, [text, userId, hydrated, lang, persistJournal, conflictRemote])

  useEffect(() => {
    if (!userId) return
    const onOnline = () => {
      void flushJournalQueue().then(showSyncSuccessToast)
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [userId, flushJournalQueue, showSyncSuccessToast])

  async function handleResolveConflict(choice: 'local' | 'remote' | 'merge') {
    if (!userId || !conflictRemote) return
    const next =
      choice === 'local'
        ? text
        : choice === 'remote'
          ? conflictRemote
          : mergeJournalConflictTexts(text, conflictRemote)
    dispatch({ type: 'resolveConflict', text: next })
    writeDayJournal(userId, next)
    await persistJournal(next, userId, lang)
  }

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
      {conflictRemote && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--text-2)]"
        >
          <p className="font-semibold text-[var(--text-1)]">{t('dashboard.journalConflictTitle')}</p>
          <p className="mt-1 text-xs text-[var(--text-3)]">{t('dashboard.journalConflictHint')}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
                {t('dashboard.journalConflictLocalLabel')}
              </p>
              <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-[var(--text-2)]">
                {text}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-3)]">
                {t('dashboard.journalConflictRemoteLabel')}
              </p>
              <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-[var(--text-2)]">
                {conflictRemote}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleResolveConflict('local')}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-semibold text-[var(--text-1)] hover:bg-[var(--bg-subtle)]"
            >
              {t('dashboard.journalKeepLocal')}
            </button>
            <button
              type="button"
              onClick={() => void handleResolveConflict('remote')}
              className="flex-1 rounded-lg border border-[#534AB7]/30 bg-[#EEEDFE]/80 px-3 py-2 text-xs font-semibold text-[#534AB7] hover:bg-[#EEEDFE] dark:bg-[#2d2a5e]/50 dark:text-[#a09be8]"
            >
              {t('dashboard.journalUseRemote')}
            </button>
            <button
              type="button"
              onClick={() => void handleResolveConflict('merge')}
              className="flex-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-500/20 dark:text-amber-200"
            >
              {t('dashboard.journalMergeBoth')}
            </button>
          </div>
        </div>
      )}
      <textarea
        value={text}
        onChange={e => dispatch({ type: 'update', text: e.target.value })}
        rows={4}
        disabled={!!conflictRemote}
        placeholder={t('dashboard.journalPlaceholder')}
        className="mt-3 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)] focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
      />
      <button
        type="button"
        onClick={handlePolish}
        disabled={polishing || !text.trim() || !!conflictRemote}
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
