'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { List, LayoutList, Phone, Bot, Copy, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, useMarkContacted } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { STAGE_LABEL, STAGE_COLOR } from '@/lib/stages'
import { waHref } from '@/lib/waLink'
import { generateQuickMessageAction } from '../actions'
import { toast } from 'sonner'
import { isAILimitReached, incrementAIUsage, remainingAIUsage, DAILY_AI_LIMIT } from '@/lib/aiUsage'
import { useTranslation } from '@/providers/LanguageProvider'

function formatDaysAgo(days: number): string {
  if (!isFinite(days)) return 'Hiç aranmadı'
  if (days < 1) return 'Bugün'
  if (days < 2) return '1 gün önce'
  return `${Math.floor(days)} gün önce`
}

export function IlgilenContent() {
  const { lang, t } = useTranslation()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list')
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [copiedFor, setCopiedFor] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const { daily, remaining, all } = useDailyActions(candidates)
  const markContacted = useMarkContacted(ws?.workspaceId ?? '')

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const isSuperAdmin = userEmail === 'suattayfuntopak@gmail.com'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  async function handleAIMessage(id: string, name: string, stage: string, note: string | null) {
    if (isAILimitReached(isSuperAdmin)) {
      toast.error(`Günlük ${DAILY_AI_LIMIT} AI mesaj limitine ulaştınız. Yarın yenilenir.`)
      return
    }
    setGeneratingFor(id)
    const result = await generateQuickMessageAction({ name, stage, note })
    setGeneratingFor(null)
    if (result.error || !result.message) {
      toast.error(result.error ?? 'Mesaj oluşturulamadı.')
      return
    }
    incrementAIUsage(isSuperAdmin)
    await navigator.clipboard.writeText(result.message)
    setCopiedFor(id)
    const remaining = remainingAIUsage(isSuperAdmin)
    toast.success(`Mesaj panoya kopyalandı! ${isSuperAdmin ? '(Sınırsız)' : `(${remaining} hak kaldı)`}`)
    setTimeout(() => setCopiedFor(null), 2500)
  }

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

      const listData = showAll ? all : daily

      return (
        <div className="space-y-4">
          {/* Başlık + görünüm toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-2)]">
              <span className="font-semibold text-[var(--text-1)]">{listData.length}</span> kişi öncelikli
              {remaining > 0 && !showAll && (
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
              {listData.map(c => (
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
              {/* Eylem butonları — tıklama propagasyonu engelle */}
              <div className="flex shrink-0 gap-1.5" onClick={e => e.stopPropagation()}>
                {/* Inline AI Mesaj */}
                <button
                  onClick={() => handleAIMessage(c.id, c.full_name, c.stage, c.note ?? null)}
                  disabled={generatingFor === c.id}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFE] text-[#534AB7] transition hover:opacity-80 disabled:opacity-50"
                  aria-label="AI Mesaj Üret"
                  title="AI Mesaj Üret ve Kopyala"
                >
                  {generatingFor === c.id ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
                  ) : copiedFor === c.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
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
            {listData.map((c, i) => (
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
            {showAll ? (
              <>
                {t('today.allPriorityListed')}{' '}
                <button
                  onClick={() => setShowAll(false)}
                  className="font-bold text-[#72243E] hover:underline ml-1"
                >
                  {t('today.collapse')}
                </button>
              </>
            ) : (
              <>
                {t('today.moreLeadsPending', { remaining, count: daily.length })}{' '}
                <button
                  onClick={() => setShowAll(true)}
                  className="font-bold text-[#534AB7] hover:underline ml-1"
                >
                  {t('today.showAll')}
                </button>
              </>
            )}
          </p>
        )}
      </div>
  )
}
