'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { List, LayoutList, Phone } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, useMarkContacted } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { STAGE_LABEL, STAGE_COLOR } from '@/lib/stages'
import { waHref } from '@/lib/waLink'

function formatDaysAgo(days: number): string {
  if (!isFinite(days)) return 'Hiç aranmadı'
  if (days < 1) return 'Bugün'
  if (days < 2) return '1 gün önce'
  return `${Math.floor(days)} gün önce`
}

export function IlgilenContent() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list')

  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const { daily, remaining } = useDailyActions(candidates)
  const markContacted = useMarkContacted(ws?.workspaceId ?? '')

  if (wsLoading || cLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        ))}
      </div>
    )
  }

  if (daily.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
        <p className="mb-2 text-3xl">🎉</p>
        <p className="text-sm font-semibold text-[var(--text-1)]">Bugün için bekleyen eylem yok</p>
        <p className="mt-1 text-xs text-[var(--text-2)]">Harika iş çıkardın!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Başlık + görünüm toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-2)]">
          <span className="font-semibold text-[var(--text-1)]">{daily.length}</span> kişi öncelikli
          {remaining > 0 && (
            <span className="ml-1 text-[var(--text-3)]">+{remaining} daha bekliyor</span>
          )}
        </p>
        <div className="flex overflow-hidden rounded-xl border border-[var(--border)]">
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'flex h-9 w-9 items-center justify-center transition-colors',
              viewMode === 'list' ? 'bg-[#534AB7] text-white' : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={clsx(
              'flex h-9 w-9 items-center justify-center transition-colors',
              viewMode === 'compact' ? 'bg-[#534AB7] text-white' : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
            )}
          >
            <LayoutList className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <ul className="space-y-3">
          {daily.map(c => (
            <li
              key={c.id}
              onClick={() => router.push(`/pipeline/${c.id}`)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm transition-colors hover:border-[#534AB7]/30 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-bold text-[#534AB7]">
                {c.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-1)]">{c.full_name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STAGE_COLOR[c.stage])}>
                    {STAGE_LABEL[c.stage]}
                  </span>
                  <span className="text-xs text-[var(--text-3)]">{formatDaysAgo(c.daysSinceContact)}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5" onClick={e => e.stopPropagation()}>
                {waHref(c.phone) && (
                  <a
                    href={waHref(c.phone)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markContacted.mutate({ id: c.id, actionType: 'whatsapp' })}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                  </a>
                )}
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    onClick={() => markContacted.mutate({ id: c.id, actionType: 'call' })}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFE] text-[#534AB7]"
                    aria-label="Ara"
                  >
                    <Phone className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          {daily.map((c, i) => (
            <div
              key={c.id}
              onClick={() => router.push(`/pipeline/${c.id}`)}
              className={clsx(
                'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-subtle)] active:scale-[0.99]',
                i > 0 && 'border-t border-[var(--border)]'
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xs font-bold text-[#534AB7]">
                {c.full_name.charAt(0).toUpperCase()}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
              <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', STAGE_COLOR[c.stage])}>
                {STAGE_LABEL[c.stage]}
              </span>
              <span className="shrink-0 text-xs text-[var(--text-3)]">{formatDaysAgo(c.daysSinceContact)}</span>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <p className="rounded-2xl border border-dashed border-[var(--border)] py-3 text-center text-xs text-[var(--text-3)]">
          +{remaining} kişi daha takip bekliyor — önce bu {daily.length}&apos;ini tamamla
        </p>
      )}
    </div>
  )
}
