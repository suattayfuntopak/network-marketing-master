'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { queryKeys } from '@/lib/query/keys'

export interface TeamMember {
  user_id: string
  full_name: string | null
  role: 'leader' | 'member'
  joined_at: string | null
  candidate_count: number
  yeni_count: number
  iletisim_count: number
  davetli_count: number
  sunum_count: number
  takip_count: number
  katildi_count: number
  last_activity_at: string | null
  onboarding_steps?: string[]
  today_roleplay?: number
  today_compliance?: number
  today_message?: number
  avatar_url?: string | null
}

const TEAM_STALE = 2 * 60 * 1000

function teamQueryOptions(workspaceId: string | undefined) {
  return {
    queryKey: workspaceId ? queryKeys.team(workspaceId) : (['team', 'none'] as const),
    queryFn: () => fetchTeamBundleAction(workspaceId!),
    enabled: !!workspaceId,
    staleTime: TEAM_STALE,
    placeholderData: keepPreviousData,
  } as const
}

export function useTeamMembers(workspaceId: string | undefined) {
  return useQuery({
    ...teamQueryOptions(workspaceId),
    select: data => data.members,
  })
}

export function useEkipPanelRows(workspaceId: string | undefined) {
  return useQuery({
    ...teamQueryOptions(workspaceId),
    select: data => data.ekipRows,
  })
}
