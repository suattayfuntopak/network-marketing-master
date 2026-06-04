'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  readDayJournal,
  writeDayJournal,
} from '@/lib/domain/dayRitual'
import { polishDayJournalAction } from '../actions/journal'

export function DayJournalCard() {
  const { t, lang } = useTranslation()
  const { data: ws } = useWorkspace()
  const userId = ws?.userId
  const [text, setText] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [polishing, setPolishing] = useState(false)

  useEffect(() => {
    if (!userId) return
    setText(readDayJournal(userId))
    setHydrated(true)
  }, [userId])

  useEffect(() => {
    if (!userId || !hydrated) return
    const id = window.setTimeout(() => writeDayJournal(userId, text), 400)
    return () => window.clearTimeout(id)
  }, [text, userId, hydrated])

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
        setText(result.text)
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
        onChange={e => setText(e.target.value)}
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
