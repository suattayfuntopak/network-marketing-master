'use client'

import { useState } from 'react'
import { Clock, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { getMessageTypeLabel } from './yazarFormLabels'

export interface HistoryEntry {
  message: string
  candidateName: string
  messageType: string
  timestamp: number
}

export function MessageHistorySection({ history }: { history: HistoryEntry[] }) {
  const { t, lang } = useTranslation()
  const [open, setOpen] = useState(false)

  if (history.length === 0) return null

  function handleCopy(msg: string) {
    navigator.clipboard.writeText(msg)
    toast.success('Mesaj kopyalandı!')
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-2)]">
          <Clock className="h-4 w-4" />
          {t('coachUi.recentMessages')} ({history.length})
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-[var(--text-3)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-3)]" />}
      </button>
      {open && (
        <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {history.map((entry, i) => (
            <li key={i} className="p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-1)]">{entry.candidateName}</span>
                  <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-medium text-[#0F6E56]">
                    {getMessageTypeLabel(entry.messageType, lang)}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(entry.message)}
                  className="flex items-center gap-1 rounded-lg bg-[var(--bg-subtle)] px-2 py-1 text-[10px] font-semibold text-[var(--text-2)] transition hover:bg-[var(--border)]"
                >
                  <Copy className="h-2.5 w-2.5" />
                  {t('coachUi.copy')}
                </button>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-3)]">{entry.message}</p>
              <p className="mt-1 text-[10px] text-[var(--text-3)]">
                {new Date(entry.timestamp).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
