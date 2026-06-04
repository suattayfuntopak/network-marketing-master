'use client'

import { useState } from 'react'
import { Copy, Check, KeyRound } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

interface Props {
  inviteCode: string
  show: boolean
}

export function PanoInviteChip({ inviteCode, show }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  if (!show || !inviteCode.trim()) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard denied */
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
          <KeyRound className="h-4 w-4 text-amber-700 dark:text-amber-400" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--text-3)]">{t('dashboard.inviteChipTitle')}</p>
          <p className="truncate font-mono text-sm font-bold tracking-wide text-[var(--text-1)]">{inviteCode}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-[#0F6E56]" />
            {t('dashboard.inviteCopied')}
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            {t('dashboard.inviteChipCopy')}
          </>
        )}
      </button>
    </div>
  )
}
