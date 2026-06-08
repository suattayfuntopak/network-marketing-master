'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Phone } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { useDailyActions } from '@/hooks/useDailyActions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { STAGE_COLOR } from '@/lib/domain/stages'
import { waHref } from '@/lib/utils/waLink'
import { logHubContactAction } from '@/app/(dashboard)/crown/actions'
import { Skeleton } from '@/components/ui/Skeleton'

const PREVIEW = 3

export function HubPriorityStrip() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const { candidates, isLoading } = useCandidates(ws?.workspaceId)
  const { daily } = useDailyActions(candidates)
  const [loggingId, setLoggingId] = useState<string | null>(null)

  const preview = daily.slice(0, PREVIEW)

  async function handleLog(candidateId: string, type: 'call' | 'whatsapp') {
    if (!ws?.workspaceId) return
    setLoggingId(candidateId)
    try {
      await logHubContactAction(ws.workspaceId, candidateId, type)
      qc.invalidateQueries({ queryKey: ['goal-dashboard'] })
      qc.invalidateQueries({ queryKey: ['pano-field-insights'] })
      qc.invalidateQueries({ queryKey: ['hub', 'daily-self'] })
      qc.invalidateQueries({ queryKey: ['hub', 'weekly-self'] })
      qc.invalidateQueries({ queryKey: ['hub', 'monthly-self'] })
      qc.invalidateQueries({ queryKey: ['stats-funnel-actuals'] })
      toast.success(t('crown.contactLogged'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'))
    } finally {
      setLoggingId(null)
    }
  }

  if (isLoading) return <Skeleton className="h-32 rounded-2xl" />
  if (preview.length === 0) return null

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
        {t('crown.priorityTitle')}
      </p>
      <ul className="space-y-2">
        {preview.map(c => {
          const fields = resolveCandidateFields(c)
          const wa = waHref(c.phone)
          const busy = loggingId === c.id
          return (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/40 px-2 py-2"
            >
              <Link href={`/pipeline/${c.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                <PersonAvatar name={c.full_name} imageUrl={fields.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-1)]">{c.full_name}</p>
                  <span className={clsx('text-[10px] font-semibold rounded-full px-1.5 py-0.5', STAGE_COLOR[c.stage])}>
                    {t(`stages.${c.stage}`)}
                  </span>
                </div>
              </Link>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleLog(c.id, 'call')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/5 text-blue-600 transition hover:bg-blue-500/10 disabled:opacity-50"
                  title={t('crown.logCall')}
                >
                  <Phone className="h-3.5 w-3.5" />
                </button>
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLog(c.id, 'whatsapp')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 text-[#128C7E] transition hover:bg-[#25D366]/10"
                    title={t('crown.openWa')}
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
