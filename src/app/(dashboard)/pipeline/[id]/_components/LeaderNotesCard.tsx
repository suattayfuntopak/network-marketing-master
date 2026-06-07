'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { StickyNote, ChevronUp, ChevronDown, Bot, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { useCandidateNotes, useLeaderNotesCount, useAddCandidateNote } from '@/hooks/useCandidates'
import { useDeferredCandidateSection } from '@/hooks/useDeferredCandidateSection'
import {
  resolveDailyActionNote,
  displayDailyActionNote,
  parseBilingualText,
  isLeaderUserNote,
} from '@/lib/domain/dailyActionNote'
import { generateNotesSummary, translateNoteAction, persistLeaderNoteTranslationAction } from '../actions'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'

interface Props {
  candidateId: string
  workspaceId: string
  candidateName: string
}

export function LeaderNotesCard({ candidateId, workspaceId, candidateName }: Props) {
  const { lang, t } = useTranslation()
  const queryClient = useQueryClient()
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  const { anchorRef, shouldLoad, requestLoad } = useDeferredCandidateSection()

  const [notesOpen, setNotesOpen] = useState(false)
  const [showAllNotes, setShowAllNotes] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isSummaryPending, setIsSummaryPending] = useState(false)

  const shouldFetchCount = shouldLoad && !notesOpen
  const shouldFetchNotes = notesOpen
  const { data: notesCount = 0 } = useLeaderNotesCount(candidateId, shouldFetchCount)
  const { data: notes = [] } = useCandidateNotes(candidateId, shouldFetchNotes)
  const leaderNotes = useMemo(() => notes.filter(isLeaderUserNote), [notes])
  const noteBadgeCount = notesOpen ? leaderNotes.length : notesCount
  const addNoteMutation = useAddCandidateNote(workspaceId)
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()

  const attemptedActionUpdates = useRef<Record<string, boolean>>({})

  const handleGenerateSummary = async () => {
    if (leaderNotes.length === 0) return
    if (!hasAiFieldAccess) {
      openUpgrade('ai_field')
      return
    }
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
              await persistLeaderNoteTranslationAction(n.id, translated)
              queryClient.invalidateQueries({ queryKey: ['candidate-notes', candidateId] })
              queryClient.invalidateQueries({ queryKey: ['activity', candidateId] })
            }
          })
          .catch(err => console.error('Lider notu otomatik çeviri hatası:', err))
      }
    })
  }, [lang, leaderNotes, candidateId, queryClient])

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
    <div
      ref={anchorRef}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-all duration-300"
    >
      <button
        onClick={() => {
          requestLoad()
          setNotesOpen(!notesOpen)
        }}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEEDFE] text-[#534AB7]">
            <StickyNote className="h-4.5 w-4.5" />
          </div>
          <span className="text-sm font-bold text-[var(--text-1)]">
            {t('pipelinePage.leaderNote')}
          </span>
          {noteBadgeCount > 0 && (
            <span className="rounded-full bg-[#EEEDFE] px-2 py-0.5 text-xs font-bold text-[#534AB7]">
              {noteBadgeCount}
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
              placeholder={t('pipelinePage.writeLeaderNotePlaceholder', { name: candidateName })}
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
      {UpgradePrompt}
    </div>
  )
}
