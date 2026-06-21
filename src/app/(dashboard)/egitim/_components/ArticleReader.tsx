'use client'

import { useEffect, useRef, useState, Fragment, type ReactNode } from 'react'
import { Check, CheckCircle2, Circle, Clock, Copy, Star, X } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { whatsappShareUrl } from '@/lib/utils/waLink'
import { SEVIYE_RENK } from '../constants'
import type { TrainingTopic } from '../types'

type Props = {
  konu: TrainingTopic
  isFav: boolean
  isRead: boolean
  onClose: () => void
  onToggleFav: () => void
  onToggleRead: () => void
}

/** `**kalın**` satır-içi vurguyu güvenli React düğümlerine çevirir (dangerouslySetInnerHTML yok). */
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[var(--text-1)]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

/**
 * Sade markdown gövdesini premium tipografiyle render eder.
 * Biçim: boş satır = paragraf, `## ` = ara başlık, `- ` = madde, `> ` = alıntı.
 */
function ArticleBody({ govde }: { govde: string }) {
  const blocks: ReactNode[] = []
  const lines = govde.split('\n')
  let listBuffer: string[] = []

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return
    const items = [...listBuffer]
    listBuffer = []
    blocks.push(
      <ul key={key} className="my-4 space-y-2.5 pl-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3730A3] dark:bg-[#a5b4fc]" />
            <span className="text-[15px] leading-relaxed text-[var(--text-2)]">{renderInline(item)}</span>
          </li>
        ))}
      </ul>,
    )
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()
    if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2))
      return
    }
    flushList(`list-${idx}`)
    const trimmed = line.trim()
    if (trimmed === '') return
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h2 key={idx} className="mt-8 mb-3 text-lg font-bold leading-snug text-[var(--text-1)] sm:text-xl">
          {renderInline(trimmed.slice(3))}
        </h2>,
      )
      return
    }
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3 key={idx} className="mt-6 mb-2 text-base font-bold text-[var(--text-1)]">
          {renderInline(trimmed.slice(4))}
        </h3>,
      )
      return
    }
    if (trimmed.startsWith('> ')) {
      blocks.push(
        <blockquote
          key={idx}
          className="my-5 rounded-r-xl border-l-4 border-[#3730A3] dark:border-[#a5b4fc] bg-[#EEF2FF] dark:bg-[#1e1b4b]/60 px-4 py-3 text-[15px] font-medium italic leading-relaxed text-[#3730A3] dark:text-[#a5b4fc]"
        >
          {renderInline(trimmed.slice(2))}
        </blockquote>,
      )
      return
    }
    blocks.push(
      <p key={idx} className="my-4 text-[15px] leading-[1.75] text-[var(--text-2)] sm:text-base">
        {renderInline(trimmed)}
      </p>,
    )
  })
  flushList('list-end')

  return <>{blocks}</>
}

export function ArticleReader({ konu, isFav, isRead, onClose, onToggleFav, onToggleRead }: Props) {
  const { t, lang } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)

  useBodyScrollLock(true)

  const baslik = lang === 'en' && konu.baslikEn ? konu.baslikEn : konu.baslik
  const ozet = lang === 'en' && konu.ozetEn ? konu.ozetEn : konu.ozet
  const govde = (lang === 'en' && konu.govdeEn ? konu.govdeEn : konu.govde) ?? ''
  const kategoriBaslik =
    lang === 'en' && konu.kategoriBaslikEn ? konu.kategoriBaslikEn : konu.kategoriBaslik

  // ESC ile kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setProgress(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${baslik}\n\n${govde}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const waText = t('trainingPage.waShare', { title: baslik, body: ozet })

  return (
    <div className={`fixed inset-0 ${Z.fullscreen} bg-[var(--bg)] animate-in fade-in duration-200`}>
      {/* Okuma ilerleme çubuğu */}
      <div className={`absolute inset-x-0 top-0 ${Z.cardControls} h-1 bg-[var(--bg-subtle)]`}>
        <div
          className="h-full bg-[#3730A3] dark:bg-[#a5b4fc] transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Üst bar */}
      <div className={`absolute inset-x-0 top-1 ${Z.cardControls} flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 py-3 backdrop-blur-md`}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xl leading-none">{konu.emoji}</span>
          <span className="truncate text-[11px] font-bold uppercase tracking-wider text-[#3730A3] dark:text-[#a5b4fc]">
            {kategoriBaslik}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('trainingPage.closeForm')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Gövde */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-5 pb-32 pt-20"
      >
        <article className="mx-auto w-full max-w-[680px]">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${SEVIYE_RENK[konu.seviye] ?? ''}`}>
              {konu.seviye}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-3)]">
              <Clock className="h-3 w-3" />
              {konu.sure}
            </span>
          </div>

          <h1 className="mb-3 text-2xl font-extrabold leading-tight text-[var(--text-1)] sm:text-3xl">
            {baslik}
          </h1>

          <p className="mb-6 border-b border-[var(--border)] pb-6 text-base leading-relaxed text-[var(--text-2)] font-medium">
            {ozet}
          </p>

          <ArticleBody govde={govde} />
        </article>
      </div>

      {/* Alt aksiyon barı */}
      <div className={`absolute inset-x-0 bottom-0 ${Z.cardControls} border-t border-[var(--border)] bg-[var(--bg)]/95 px-4 py-3 backdrop-blur-md`}>
        <div className="mx-auto flex max-w-[680px] items-center justify-between gap-2">
          <button
            type="button"
            onClick={onToggleRead}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition active:scale-95 ${
              isRead
                ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            {isRead ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {isRead ? t('training.markAsUnread') : t('training.markAsRead')}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFav}
              title={isFav ? t('training.removeFromFavorites') : t('training.addToFavorites')}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-95 ${
                isFav
                  ? 'bg-amber-500/10 text-amber-500 dark:bg-[#2962FF]/10 dark:text-[#448AFF]'
                  : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-3)] hover:text-amber-500'
              }`}
            >
              <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              title={copied ? t('trainingPage.copied') : t('trainingPage.copyContent')}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-95 ${
                copied
                  ? 'bg-[#E1F5EE] text-[#0F6E56] dark:bg-[#0d3d2e] dark:text-[#4ade80]'
                  : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-3)] hover:text-[#3730A3]'
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>

            <a
              href={whatsappShareUrl(waText)}
              target="_blank"
              rel="noopener noreferrer"
              title={t('trainingPage.sendViaWhatsApp')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7FBF0] dark:bg-[#0d2e1a]/50 text-[#1a9e4f] dark:text-[#4ade80] transition hover:bg-[#d4f7e4] active:scale-95"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.118 1.523 5.845L0 24l6.335-1.508A11.927 11.927 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 01-5.031-1.386l-.361-.214-3.761.896.953-3.651-.235-.374A9.778 9.778 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
