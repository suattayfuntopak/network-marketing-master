'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, UserPlus } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Z } from '@/lib/ui/zIndex'
import { clsx } from 'clsx'

const DISMISS_PREFIX = 'nmm_pano_welcome_dismissed_'
/** Yalnızca boru hattı boşken göster — pano üst alanı sade kalır */
const EARLY_CANDIDATE_MAX = 1

export function WelcomeCard({ candidateCount }: { candidateCount: number }) {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const userId = ws?.userId
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return
    setDismissed(localStorage.getItem(`${DISMISS_PREFIX}${userId}`) === '1')
  }, [userId])

  if (candidateCount >= EARLY_CANDIDATE_MAX || dismissed) return null

  function dismiss() {
    if (!userId) return
    localStorage.setItem(`${DISMISS_PREFIX}${userId}`, '1')
    setDismissed(true)
  }

  return (
    <div
      className={clsx(
        Z.cardOverlay,
        'fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))]',
      )}
    >
      <div className="relative rounded-2xl border border-[#534AB7]/30 bg-[var(--bg-card)] p-4 shadow-lg shadow-black/10">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-3)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
          aria-label={t('dashboard.welcomeDismiss')}
        >
          <X className="h-4 w-4" />
        </button>
        <p className="pr-10 text-sm font-bold text-[var(--text-1)]">{t('dashboard.welcomeTitle')}</p>
        <p className="mt-1 text-sm text-[var(--text-2)]">{t('dashboard.welcomeBody')}</p>
        <p className="mt-2 text-xs font-semibold text-[#534AB7]">{t('dashboard.welcomeTask')}</p>
        <Link
          href="/pipeline"
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#534AB7] px-4 text-sm font-semibold text-white transition hover:bg-[#453DA0] active:scale-[0.99]"
        >
          <UserPlus className="h-4 w-4" strokeWidth={1.75} />
          {t('dashboard.welcomeAddCandidate')}
        </Link>
      </div>
    </div>
  )
}
