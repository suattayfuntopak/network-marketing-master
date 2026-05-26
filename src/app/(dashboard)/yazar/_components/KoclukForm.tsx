'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { Copy, Loader2, Bot, HelpCircle, Check, Send } from 'lucide-react'
import { clsx } from 'clsx'
import { askCoachAction, translateTextAction } from '../actions'
import { useAIUsage } from '@/hooks/useAIUsage'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'

import { DAILY_MESSAGE_LIMIT } from '@/lib/aiUsage'

export function KoclukForm() {
  const { lang } = useTranslation()
  const [state, action, isPending] = useActionState(askCoachAction, {})
  const [question, setQuestion] = useState('')
  const [copied, setCopied] = useState(false)

  // Real-time automatic translation state
  const [displayedAnswer, setDisplayedAnswer] = useState('')
  const [generatedLang, setGeneratedLang] = useState<'tr' | 'en'>(lang)
  const [translating, setTranslating] = useState(false)
  
  const { data: usage } = useAIUsage()
  const qc = useQueryClient()
  const isSuperAdmin = usage?.isSuperAdmin ?? false
  const used = usage?.messageUsed ?? 0
  const remaining = Math.max(0, DAILY_MESSAGE_LIMIT - used)
  const limitReached = !isSuperAdmin && remaining <= 0

  const prevAnswerRef = useRef<string | undefined>(undefined)

  // Invalidate queries when answer changes successfully
  useEffect(() => {
    if (state.answer && state.answer !== prevAnswerRef.current) {
      prevAnswerRef.current = state.answer
      qc.invalidateQueries({ queryKey: ['daily-ai-usage'] })
    }
  }, [state.answer, qc])

  // Sync displayed answer when new response is generated
  useEffect(() => {
    if (state.answer) {
      setDisplayedAnswer(state.answer)
      setGeneratedLang(lang)
    }
  }, [state.answer])

  // Handle global language toggle auto-translation
  useEffect(() => {
    if (displayedAnswer && lang !== generatedLang) {
      let active = true
      setTranslating(true)
      
      translateTextAction(displayedAnswer, lang)
        .then(res => {
          if (active && res.translatedText) {
            setDisplayedAnswer(res.translatedText)
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
  }, [lang, displayedAnswer, generatedLang])

  function handleCopy() {
    if (displayedAnswer) {
      navigator.clipboard.writeText(displayedAnswer)
      setCopied(true)
      toast.success(lang === 'en' ? 'Answer copied!' : 'Cevap kopyalandı!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Limit & Bilgilendirme Kartı */}
      <div className="rounded-2xl border border-[#EEF2FF] dark:border-[#1e1b4b] bg-[#EEF2FF]/60 dark:bg-[#1e1b4b]/40 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E0E7FF] dark:bg-[#2e2a75]">
            <HelpCircle className="h-4 w-4 text-[#3730A3] dark:text-[#c7d2fe]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#3730A3] dark:text-[#c7d2fe]">
              {lang === 'en' ? 'Ask Your AI Coach' : 'Yapay Zeka Koçuna Sor'}
            </p>
            <p className="text-[11px] text-[#3730A3]/70 dark:text-[#c7d2fe]/70 mt-0.5 font-medium">
              {lang === 'en' 
                ? 'Ask anything related to Network Marketing and strategy.' 
                : 'Network marketing ve liderlikle ilgili merak ettiğin her şeyi sor.'}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-[#3730A3] dark:text-[#c7d2fe]">
            {isSuperAdmin ? (lang === 'en' ? 'Unlimited' : 'Sınırsız') : `${remaining} / ${DAILY_MESSAGE_LIMIT}`}
          </p>
          <p className="text-[9px] text-[#3730A3]/60 dark:text-[#c7d2fe]/60 font-semibold uppercase tracking-wider">
            {lang === 'en' ? 'Daily AI Quota' : 'Günlük Limit'}
          </p>
        </div>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="lang" value={lang} />
        
        <div>
          <label htmlFor="questionText" className="block text-sm font-semibold text-[var(--text-1)] mb-1.5">
            {lang === 'en' ? 'Your Question' : 'Sorunuz'}
          </label>
          <textarea
            id="questionText"
            name="question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            disabled={isPending || limitReached}
            placeholder={lang === 'en' 
              ? 'e.g. How can I increase candidate retention in the follow-up stage?' 
              : 'Örn: Takip aşamasında adayların sürece sadık kalmasını nasıl sağlayabilirim?'}
            rows={4}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#3730A3] focus:ring-2 focus:ring-[#EEF2FF] dark:focus:ring-[#1e1b4b] disabled:opacity-50"
          />
        </div>

        {state.error && (
          <div className="rounded-xl bg-[#FDF2F2] border border-[#FDE8E8] px-4 py-3 text-xs text-[#9B1C1C] dark:bg-[#771D1D]/20 dark:border-[#771D1D]/30 dark:text-[#F8B4B4]">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || limitReached || !question.trim()}
          className={clsx(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all cursor-pointer shadow-md select-none",
            limitReached
              ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
              : "bg-[#3730A3] hover:bg-[#2d2785] active:scale-[0.98]"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{lang === 'en' ? 'Thinking...' : 'Koç Düşünüyor...'}</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>
                {limitReached 
                  ? (lang === 'en' ? 'Daily Limit Reached' : 'Günlük Limite Ulaştınız')
                  : (lang === 'en' ? 'Ask Coach' : 'Koç’a Sor')}
              </span>
            </>
          )}
        </button>
      </form>

      {/* AI Answer Display */}
      {displayedAnswer && (
        <div className="rounded-2xl border border-[#EEF2FF] dark:border-[#1e1b4b] bg-[var(--bg-card)] p-5 shadow-lg animate-in slide-in-from-bottom-3 duration-300">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FF] dark:bg-[#1e1b4b]">
                <Bot className="h-4 w-4 text-[#3730A3] dark:text-[#a5b4fc]" />
              </div>
              <span className="text-xs font-bold text-[var(--text-1)]">
                {lang === 'en' ? 'AI Coach Answer' : 'Yapay Zeka Koçunun Yanıtı'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                title={copied ? (lang === 'en' ? 'Copied' : 'Kopyalandı') : (lang === 'en' ? 'Copy Answer' : 'Cevabı Kopyala')}
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-all border cursor-pointer",
                  copied
                    ? "bg-[#E1F5EE] text-[#0F6E56] border-[#E1F5EE] dark:bg-[#0d3d2e]/30 dark:text-[#4ade80] dark:border-[#0d3d2e]/40"
                    : "bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[#EEF2FF] hover:text-[#3730A3] border-[var(--border)] dark:hover:bg-[#1e1b4b] dark:hover:text-[#a5b4fc]"
                )}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              {/* WhatsApp Share Button */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(displayedAnswer)}`}
                target="_blank"
                rel="noopener noreferrer"
                title={lang === 'en' ? 'Share on WhatsApp' : 'WhatsApp ile Paylaş'}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] text-[#25D366] hover:bg-[#E8F8EF] dark:hover:bg-[#0d3d2e]/20 transition-all cursor-pointer"
              >
                <WhatsAppIcon className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>
          <div className="relative text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line border-t border-[var(--border)] pt-4">
            {translating ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#3730A3]" />
                <span className="text-xs font-semibold text-[var(--text-3)] animate-pulse">
                  {lang === 'en' ? 'Translating answer...' : 'Cevap çevriliyor...'}
                </span>
              </div>
            ) : (
              displayedAnswer
            )}
          </div>
        </div>
      )}
    </div>
  )
}
