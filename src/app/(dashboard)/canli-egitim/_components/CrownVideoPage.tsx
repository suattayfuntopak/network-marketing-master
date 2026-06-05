'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { CrownPageShell } from '@/lib/ui/crown/CrownPageShell'
import { CrownCard } from '@/lib/ui/crown/CrownCard'
import { getCrownVideoPageAction } from '@/app/(dashboard)/crown/actions'
import { clsx } from 'clsx'

export function CrownVideoPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'video', ws?.workspaceId],
    queryFn: () => getCrownVideoPageAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
  })

  const members = data?.members ?? []
  const videoTotal = data?.videoTotal ?? 0

  return (
    <CrownPageShell
      title={t('dashboard.crownMockLiveTraining')}
      emoji="🎬"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'video'] })}
      refreshing={isFetching}
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-center text-sm text-slate-600">{t('crown.emptyTeam')}</p>
      ) : (
        members.map(m => {
          const summary = data?.videoMap[m.user_id]
          const pct = summary?.pct ?? 0
          const done = summary?.completed ?? 0
          return (
            <CrownCard key={m.user_id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-slate-800">{m.full_name ?? '—'}</p>
                <span className={clsx('shrink-0 text-sm font-bold', pct > 0 ? 'text-emerald-600' : 'text-amber-600')}>
                  %{pct}
                </span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-500">
                {t('crown.videosWatched', { total: videoTotal, done })}
              </p>
            </CrownCard>
          )
        })
      )}
    </CrownPageShell>
  )
}
