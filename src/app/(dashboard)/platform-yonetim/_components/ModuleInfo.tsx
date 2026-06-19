'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { getPlatformModuleHelp, type PlatformModuleKey } from '@/lib/domain/platformModuleHelp'

/**
 * Modül başlığının yanındaki (?) — o modülün ne işe yaradığını ve her kutunun
 * anlamını süper admin'e özel, detaylı anlatan popup. Inline açıklama metinleri
 * yerine bunu kullan (özellikle mobilde kalabalık yapmasın).
 */
export function ModuleInfo({ moduleKey }: { moduleKey: PlatformModuleKey }) {
  const { lang } = useTranslation()
  const [open, setOpen] = useState(false)
  const l: 'tr' | 'en' = lang === 'en' ? 'en' : 'tr'
  const help = getPlatformModuleHelp(moduleKey, l)
  const label = l === 'en' ? 'About this module' : 'Bu modül hakkında'
  const closeLabel = l === 'en' ? 'Close' : 'Kapat'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={label}
        aria-label={label}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-3)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
      >
        <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className={`fixed inset-0 ${Z.confirm} flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm`}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <h2 className="truncate text-lg font-bold text-[var(--text-1)]">{help.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-[var(--border)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto px-5 py-4 pb-5">
              <p className="text-sm leading-relaxed text-[var(--text-2)]">{help.intro}</p>
              <ul className="space-y-2">
                {help.items.map((it, i) => (
                  <li key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 p-3">
                    <p className="text-sm font-bold text-[var(--text-1)]">{it.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-2)]">{it.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
