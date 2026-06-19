'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GitBranch, Users, Layers, UserPlus, Crown } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { useTranslation } from '@/providers/LanguageProvider'
import { getTeamGenerationTreeAction } from '../treeActions'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'
import { computeDownlineAnalytics, monthlyJoinCohorts } from '@/lib/domain/downlineAnalytics'

type Props = {
  workspaceId: string
  teamPageUnlocked: boolean
}

export function TeamGenerationTree({ workspaceId, teamPageUnlocked }: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['team-generation-tree', workspaceId],
    queryFn: () => getTeamGenerationTreeAction(workspaceId),
    enabled: !!workspaceId,
    staleTime: QUERY_STALE.metrics,
  })

  const analytics = useMemo(() => computeDownlineAnalytics(nodes), [nodes])
  const cohorts = useMemo(() => monthlyJoinCohorts(nodes), [nodes])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  const downline = nodes.filter(n => n.generation > 0)

  const analyticsStats = [
    { icon: Users, label: t('team.analyticsTotalMembers'), value: analytics.totalMembers, color: 'text-crown' },
    { icon: Layers, label: t('team.analyticsDepth'), value: analytics.depth, color: 'text-indigo-600 dark:text-indigo-300' },
    { icon: UserPlus, label: t('team.analyticsJoined30'), value: analytics.joinedLast30, color: 'text-emerald-600 dark:text-emerald-300' },
    {
      icon: Crown,
      label: t('team.analyticsBiggestGen'),
      value: analytics.biggestGeneration
        ? t('team.analyticsGenValue', { generation: analytics.biggestGeneration.generation, count: analytics.biggestGeneration.count })
        : '—',
      color: 'text-amber-600 dark:text-amber-300',
    },
  ]

  return (
    <div className="space-y-4">
      {!teamPageUnlocked && <TeamFreeUpgradeBanner />}

      {downline.length > 0 && (
        <div>
          <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-[var(--text-3)]">
            {t('team.analyticsTitle')}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {analyticsStats.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-sm">
                  <Icon className={`h-4 w-4 ${s.color}`} />
                  <div className={`mt-1 text-xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">{s.label}</div>
                </div>
              )
            })}
          </div>

          {/* Katılım trendi — son 6 ay kohort boyutu */}
          {cohorts.some(c => c.count > 0) && (
            <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
                {t('team.analyticsCohortTitle')}
              </div>
              <div className="flex items-end justify-between gap-1.5">
                {(() => {
                  const max = Math.max(1, ...cohorts.map(c => c.count))
                  return cohorts.map(c => (
                    <div key={c.month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-[var(--text-2)]">{c.count}</span>
                      <div
                        className="w-full rounded-t bg-crown/70"
                        style={{ height: `${8 + Math.round((c.count / max) * 36)}px` }}
                      />
                      <span className="text-[9px] text-[var(--text-3)]">{c.month.slice(5)}</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
        <GitBranch className="h-4 w-4 text-crown" />
        {t('team.treeTitle')}
      </div>
      <p className="text-xs text-[var(--text-3)]">{t('team.treeSubtitle')}</p>

      {downline.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center">
          <p className="text-sm text-[var(--text-2)]">{t('team.treeEmpty')}</p>
          <Link
            href="/ekip?tab=members"
            className="mt-3 inline-block text-xs font-semibold text-brand hover:underline"
          >
            {t('team.treeInviteCta')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {nodes.map(node => (
            <li
              key={node.id}
              role={node.generation > 0 && node.pipelineId ? 'button' : undefined}
              tabIndex={node.generation > 0 && node.pipelineId ? 0 : undefined}
              onClick={() => {
                if (node.generation === 0 || !node.pipelineId) return
                router.push(`/pipeline/${node.pipelineId}`)
              }}
              onKeyDown={e => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                if (node.generation === 0 || !node.pipelineId) return
                e.preventDefault()
                router.push(`/pipeline/${node.pipelineId}`)
              }}
              className={`flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 ${
                node.generation > 0 && node.pipelineId
                  ? 'cursor-pointer transition hover:bg-[var(--bg-subtle)] active:scale-[0.99]'
                  : ''
              }`}
              style={{ marginInlineStart: `${node.generation * 12}px` }}
            >
              <PersonAvatar name={node.name} imageUrl={node.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-1)]">{node.name}</p>
                {node.generation > 0 && (
                  <p className="text-[10px] font-medium text-[var(--text-3)]">
                    {t('team.generationLabel', { n: node.generation })}
                  </p>
                )}
              </div>
              {node.generation === 0 && (
                <span className="shrink-0 rounded-full bg-brand-subtle px-2 py-0.5 text-[10px] font-bold text-brand">
                  {t('team.treeYou')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
