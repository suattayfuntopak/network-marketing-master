import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { TeamMember } from '@/hooks/useTeamMembers'

type RpcMember = {
  user_id: string
  full_name: string | null
  role: string
  joined_at: string | null
  avatar_url: string | null
  candidate_count: number
  yeni_count: number
  iletisim_count: number
  davetli_count: number
  sunum_count: number
  takip_count: number
  katildi_count: number
  last_activity_at: string | null
  onboarding_steps: string[] | unknown
  today_roleplay: number
  today_compliance: number
  today_message: number
}

import type { LeaderCandidateRow } from '@/lib/team/enrichLeaderCandidates'

type RpcCandidate = LeaderCandidateRow

export interface TeamWithDownlinesBundle {
  members: TeamMember[]
  leaderCandidates: RpcCandidate[]
  leaderOwnerId: string | null
}

function parseOnboardingSteps(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === 'string')
  return []
}

function mapRpcMember(row: RpcMember): TeamMember {
  return {
    user_id: row.user_id,
    full_name: row.full_name,
    role: row.role === 'leader' ? 'leader' : 'member',
    joined_at: row.joined_at,
    candidate_count: row.candidate_count ?? 0,
    yeni_count: row.yeni_count ?? 0,
    iletisim_count: row.iletisim_count ?? 0,
    davetli_count: row.davetli_count ?? 0,
    sunum_count: row.sunum_count ?? 0,
    takip_count: row.takip_count ?? 0,
    katildi_count: row.katildi_count ?? 0,
    last_activity_at: row.last_activity_at,
    onboarding_steps: parseOnboardingSteps(row.onboarding_steps),
    today_roleplay: row.today_roleplay ?? 0,
    today_compliance: row.today_compliance ?? 0,
    today_message: row.today_message ?? 0,
    avatar_url: row.avatar_url,
  }
}

export async function fetchTeamWithDownlines(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<TeamWithDownlinesBundle | null> {
  const { data, error } = await supabase.rpc('nmm_fetch_team_with_downlines', {
    p_workspace_id: workspaceId,
  })

  if (error) {
    console.warn('[fetchTeamWithDownlines] RPC failed, caller may fallback:', error.message)
    return null
  }

  const payload = data as {
    members?: RpcMember[]
    leader_candidates?: RpcCandidate[]
  } | null

  const members = (payload?.members ?? []).map(mapRpcMember)
  const leaderOwnerId = members.find(m => m.role === 'leader')?.user_id ?? null

  return {
    members,
    leaderCandidates: payload?.leader_candidates ?? [],
    leaderOwnerId,
  }
}
