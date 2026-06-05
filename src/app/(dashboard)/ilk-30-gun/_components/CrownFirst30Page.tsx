'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { CrownPageShell } from '@/lib/ui/crown/CrownPageShell'
import { CrownCard } from '@/lib/ui/crown/CrownCard'
import { getCrownFirst30PageAction } from '@/app/(dashboard)/crown/actions'
import { clsx } from 'clsx'

export function CrownFirst30Page() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'first30', ws?.workspaceId],
    queryFn: () => getCrownFirst30PageAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
  })

  const members = data?.members ?? []

  return (
    <CrownPageShell
      title={t('crown.first30Title')}
      emoji="🗓️"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'first30'] })}
      refreshing={isFetching}
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-center text-sm text-slate-600">{t('crown.emptyTeam')}</p>
      ) : (
        members.map(m => (
          <CrownCard key={m.userId}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate font-semibold text-slate-800">{m.fullName}</p>
              <span className={clsx('shrink-0 text-sm font-bold', m.pct > 0 ? 'text-amber-600' : 'text-slate-400')}>
                %{m.pct}
              </span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-amber-100">
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${m.pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('crown.tasksDone', { done: m.done, total: m.total })}</span>
              <span className="font-semibold text-slate-700">{t('crown.detail')}</span>
            </div>
          </CrownCard>
        ))
      )}
    </CrownPageShell>
  )
}
