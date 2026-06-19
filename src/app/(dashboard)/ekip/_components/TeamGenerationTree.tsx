'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, GitBranch, Users, Layers, UserPlus, Crown } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { useTranslation } from '@/providers/LanguageProvider'
import { getTeamGenerationTreeAction, type GenerationTreeNode } from '../treeActions'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'
import { computeDownlineAnalytics, monthlyJoinCohorts } from '@/lib/domain/downlineAnalytics'

type Props = {
  workspaceId: string
  teamPageUnlocked: boolean
}

type TreeBranch = GenerationTreeNode & { children: TreeBranch[] }

function buildTree(nodes: GenerationTreeNode[]): TreeBranch[] {
  const byId = new Map(nodes.map(n => [n.id, { ...n, children: [] as TreeBranch[] }]))
  const roots: TreeBranch[] = []

  for (const node of byId.values()) {
    if (node.parentUserId && byId.has(node.parentUserId)) {
      byId.get(node.parentUserId)!.children.push(node)
    } else if (node.generation === 0) {
      roots.push(node)
    } else {
      const leader = [...byId.values()].find(n => n.generation === 0)
      if (leader) leader.children.push(node)
    }
  }

  const sortBranch = (a: TreeBranch, b: TreeBranch) =>
    a.generation - b.generation || a.name.localeCompare(b.name)
  const walk = (branch: TreeBranch) => {
    branch.children.sort(sortBranch)
    branch.children.forEach(walk)
  }
  roots.sort(sortBranch)
  roots.forEach(walk)
  return roots
}

function TreeNodeRow({
  node,
  depth,
  expanded,
  onToggle,
  onOpenProfile,
  t,
}: {
  node: TreeBranch
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
  onOpenProfile: (id: string) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  const hasChildren = node.children.length > 0
  const isOpen = expanded.has(node.id)
  const isLeader = node.generation === 0

  return (
    <>
      <li
        className={`flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-2 py-2 sm:px-3 sm:py-2.5 ${
          !isLeader ? 'cursor-pointer transition hover:bg-[var(--bg-subtle)] active:scale-[0.99]' : ''
        }`}
        style={{ marginInlineStart: `${depth * 16}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onToggle(node.id)
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-3)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
            aria-expanded={isOpen}
            aria-label={isOpen ? t('team.treeCollapse') : t('team.treeExpand')}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-block h-8 w-8 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          disabled={isLeader}
          onClick={() => {
            if (!isLeader) onOpenProfile(node.id)
          }}
          className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
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
          {isLeader && (
            <span className="shrink-0 rounded-full bg-brand-subtle px-2 py-0.5 text-[10px] font-bold text-brand">
              {t('team.treeYou')}
            </span>
          )}
        </button>
      </li>

      {hasChildren && isOpen &&
        node.children.map(child => (
          <TreeNodeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onOpenProfile={onOpenProfile}
            t={t}
          />
        ))}
    </>
  )
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

  const leaderId = nodes.find(n => n.generation === 0)?.id ?? null
  const [expandedOverride, setExpandedOverride] = useState<Set<string> | null>(null)
  const expanded = expandedOverride ?? (leaderId ? new Set([leaderId]) : new Set<string>())

  const analytics = useMemo(() => computeDownlineAnalytics(nodes), [nodes])
  const cohorts = useMemo(() => monthlyJoinCohorts(nodes), [nodes])
  const treeRoots = useMemo(() => buildTree(nodes), [nodes])

  function toggleExpand(id: string) {
    setExpandedOverride(prev => {
      const base = prev ?? (leaderId ? new Set([leaderId]) : new Set<string>())
      const next = new Set(base)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
          {treeRoots.map(root => (
            <TreeNodeRow
              key={root.id}
              node={root}
              depth={0}
              expanded={expanded}
              onToggle={toggleExpand}
              onOpenProfile={id => router.push(`/ekip/${id}`)}
              t={t}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
