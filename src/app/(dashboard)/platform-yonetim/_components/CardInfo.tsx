'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { getPlatformCardHelp, type PlatformCardKey } from '@/lib/domain/platformCardHelp'

/**
 * Süper Admin kutusunun SAĞ ÜST köşesine konan küçük (?) — basınca SADECE o kutunun
 * ne ölçtüğünü sade dille anlatan kompakt popup açar. Kart `relative` olmalı.
 */
export function CardInfo({ cardKey }: { cardKey: PlatformCardKey }) {
  const { lang } = useTranslation()
  const [open, setOpen] = useState(false)
  const l: 'tr' | 'en' = lang === 'en' ? 'en' : 'tr'
  const help = getPlatformCardHelp(cardKey, l)
  const aria = l === 'en' ? 'What is this?' : 'Bu nedir?'
  const closeLabel = l === 'en' ? 'Close' : 'Kapat'

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        title={aria}
        aria-label={aria}
        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-3)]/55 transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
      >
        <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className={`fixed inset-0 ${Z.confirm} flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm`}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300">
                  <HelpCircle className="h-4.5 w-4.5" />
                </div>
                <h2 className="truncate text-base font-bold text-[var(--text-1)]">{help.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-[var(--border)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-sm leading-relaxed text-[var(--text-2)]">{help.desc}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
