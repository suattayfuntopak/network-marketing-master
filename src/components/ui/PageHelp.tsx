'use client'

import { Suspense, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { HelpCircle, X } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { getPageHelp, resolvePageHelpContext } from '@/lib/domain/pageHelp'

/**
 * Sağ üst (?) yardım butonu — bulunulan sayfa/sekmenin nasıl kullanılacağını anlatır.
 * `contextKey`: URL ?tab= yoksa (ör. Saha Radarı iç sekmeleri) üst bileşenden geçilir.
 *
 * `useSearchParams` yalnız MODAL içinde (butona basılınca) okunur ve Suspense ile
 * sarılır — böylece statik prerender sırasında CSR-bailout olmaz; (?) butonu her
 * zaman SSR'de görünür. (Aksi halde tüm dashboard sayfaları prerender'da patlıyordu.)
 */
export function PageHelp({
  triggerClassName,
  contextKey,
}: {
  triggerClassName?: string
  contextKey?: string
} = {}) {
  const { lang } = useTranslation()
  const [open, setOpen] = useState(false)
  const l: 'tr' | 'en' = lang === 'en' ? 'en' : 'tr'
  const helpLabel = l === 'en' ? 'How to use this page' : 'Bu sayfa nasıl kullanılır?'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={helpLabel}
        aria-label={helpLabel}
        className={
          triggerClassName ??
          'hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] sm:flex'
        }
      >
        <HelpCircle className="h-4.5 w-4.5" strokeWidth={1.75} />
      </button>

      {open && (
        <Suspense fallback={null}>
          <PageHelpModal contextKey={contextKey} l={l} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}

function PageHelpModal({
  contextKey,
  l,
  onClose,
}: {
  contextKey?: string
  l: 'tr' | 'en'
  onClose: () => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const tab =
    contextKey ??
    resolvePageHelpContext(pathname ?? '/', tabFromUrl) ??
    tabFromUrl ??
    undefined
  const help = getPageHelp(pathname ?? '/', l, tab)
  const closeLabel = l === 'en' ? 'Close' : 'Kapat'

  return (
    <div
      className={`fixed inset-0 ${Z.confirm} flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="truncate text-lg font-bold text-[var(--text-1)]">{help.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-[var(--border)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4 pb-5">
          <p className="text-sm leading-relaxed text-[var(--text-2)]">{help.intro}</p>
          <ul className="space-y-2.5">
            {help.steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-black text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--text-1)]">{s.t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-2)]">{s.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
