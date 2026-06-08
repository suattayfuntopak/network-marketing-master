'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { GitBranch } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { useTranslation } from '@/providers/LanguageProvider'
import { getTeamGenerationTreeAction } from '../treeActions'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'

type Props = {
  workspaceId: string
  teamPageUnlocked: boolean
}

export function TeamGenerationTree({ workspaceId, teamPageUnlocked }: Props) {
  const { t } = useTranslation()

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['team-generation-tree', workspaceId],
    queryFn: () => getTeamGenerationTreeAction(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
  })

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

  return (
    <div className="space-y-4">
      {!teamPageUnlocked && <TeamFreeUpgradeBanner />}

      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
        <GitBranch className="h-4 w-4 text-[#72243E]" />
        {t('team.treeTitle')}
      </div>
      <p className="text-xs text-[var(--text-3)]">{t('team.treeSubtitle')}</p>

      {downline.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-10 text-center">
          <p className="text-sm text-[var(--text-2)]">{t('team.treeEmpty')}</p>
          <Link
            href="/ekip?tab=tools"
            className="mt-3 inline-block text-xs font-semibold text-[#534AB7] hover:underline"
          >
            {t('team.treeInviteCta')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {nodes.map(node => (
            <li
              key={node.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5"
              style={{ marginInlineStart: `${node.generation * 12}px` }}
            >
              <PersonAvatar name={node.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-1)]">{node.name}</p>
                {node.generation > 0 && (
                  <p className="text-[10px] font-medium text-[var(--text-3)]">
                    {t('team.generationLabel', { n: node.generation })}
                  </p>
                )}
              </div>
              {node.generation === 0 && (
                <span className="shrink-0 rounded-full bg-[#EEEDFE] px-2 py-0.5 text-[10px] font-bold text-[#534AB7]">
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
